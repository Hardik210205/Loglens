using System;
using System.Threading.Tasks;
using LogLens.Application.DTOs;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;
using LogLens.Domain.Enums;

namespace LogLens.Application.Services
{
    public class LogService : ILogService
    {
        private readonly ILogQueueService _queueService;

        public LogService(ILogQueueService queueService)
        {
            _queueService = queueService;
        }

        public async Task EnqueueAsync(IngestLogRequest log)
        {
            var entry = new LogEntry
            {
                Timestamp = log.Timestamp,
                Level = ParseLogLevel(log.LogLevel),
                Message = log.Message,
                ServiceName = log.ServiceName,
                TraceId = log.TraceId
            };

            await _queueService.EnqueueAsync(entry);
        }

        private static LogLevel ParseLogLevel(string level) =>
            Enum.TryParse<LogLevel>(level, ignoreCase: true, out var parsed)
                ? parsed
                : LogLevel.Information;
    }
}
