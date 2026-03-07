using System;
using System.Collections.Generic;
using System.Reflection;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.SignalR;
using LogLens.Domain.Entities;
using LogLens.Infrastructure.Data;
using LogLens.Infrastructure.Queue;
using LogLens.Application.Interfaces;
using LogLens.Application.DTOs;

namespace LogLens.Infrastructure.BackgroundServices
{
    public class LogBatchInserter : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly Channel<LogEntry> _channel;
        private object? _hubContext; // Generic IHubContext<LogHub> as object to avoid reference
        private Type? _logHubType;
        private const int BatchSize = 50;
        private readonly TimeSpan _flushInterval = TimeSpan.FromSeconds(5);
        private const string ReceiveLogsMethod = "ReceiveLogs";

        public LogBatchInserter(IServiceProvider services)
        {
            _services = services;
            _channel = LogChannel.Channel;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var buffer = new List<LogEntry>(BatchSize);
            var reader = _channel.Reader;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var log = await reader.ReadAsync(stoppingToken);
                    buffer.Add(log);
                }
                catch (ChannelClosedException)
                {
                    break;
                }

                if (buffer.Count >= BatchSize ||
                    await reader.WaitToReadAsync(stoppingToken) == false)
                {
                    await FlushBuffer(buffer, stoppingToken);
                }
                else if (buffer.Count > 0)
                {
                    // wait a little while before flushing
                    await Task.Delay(_flushInterval, stoppingToken);
                    if (buffer.Count > 0)
                    {
                        await FlushBuffer(buffer, stoppingToken);
                    }
                }
            }

            if (buffer.Count > 0)
            {
                await FlushBuffer(buffer, stoppingToken);
            }
        }

        private async Task FlushBuffer(List<LogEntry> buffer, CancellationToken token)
        {
            if (buffer.Count == 0) return;

            using var scope = _services.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
            var db = scope.ServiceProvider.GetRequiredService<LogLensDbContext>();

            await repo.AddRangeAsync(buffer, token);
            await db.SaveChangesAsync(token);

            // Broadcast logs to all connected clients via SignalR
            await BroadcastLogsAsync(buffer, scope);

            buffer.Clear();
        }

        private async Task BroadcastLogsAsync(List<LogEntry> logs, IServiceScope scope)
        {
            try
            {
                // Dynamically get LogHub type to avoid circular reference
                if (_logHubType == null)
                {
                    _logHubType = Type.GetType("LogLens.API.Hubs.LogHub, LogLens.API");
                    if (_logHubType == null)
                    {
                        Console.WriteLine("LogHub type not found - SignalR broadcasting skipped");
                        return;
                    }
                }

                // Get IHubContext<LogHub> dynamically
                if (_hubContext == null)
                {
                    // Get IHubContext type dynamically
                    var iHubContextTypeName = "Microsoft.AspNetCore.SignalR.IHubContext`1, Microsoft.AspNetCore.SignalR";
                    var iHubContextBaseType = Type.GetType(iHubContextTypeName);
                    if (iHubContextBaseType == null)
                    {
                        Console.WriteLine("IHubContext type not found");
                        return;
                    }
                    var iHubContextType = iHubContextBaseType.MakeGenericType(_logHubType);
                    _hubContext = scope.ServiceProvider.GetService(iHubContextType);
                    if (_hubContext == null)
                    {
                        Console.WriteLine("IHubContext not available - SignalR broadcasting skipped");
                        return;
                    }
                }

                // Convert LogEntry to DTO for client consumption
                var logDtos = new List<LogDto>();
                foreach (var log in logs)
                {
                    logDtos.Add(new LogDto
                    {
                        Timestamp = log.Timestamp,
                        Level = log.Level,
                        Message = log.Message,
                        Metadata = log.Metadata
                    });
                }

                // Send to all connected clients via reflection
                var clientsProperty = _hubContext.GetType().GetProperty("Clients");
                var clients = clientsProperty?.GetValue(_hubContext);
                var allProperty = clients?.GetType().GetProperty("All");
                var all = allProperty?.GetValue(clients);
                var sendAsyncMethod = all?.GetType().GetMethod("SendAsync", new[] { typeof(string), typeof(object[]) });
                await (Task?)sendAsyncMethod?.Invoke(all, new object[] { ReceiveLogsMethod, new object[] { logDtos } })!;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error broadcasting logs: {ex.Message}");
            }
        }
    }
}