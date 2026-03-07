using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;
using LogLens.Infrastructure.Data;

namespace LogLens.Infrastructure.BackgroundServices
{
    public class MlProcessingService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<MlProcessingService> _logger;
        private readonly TimeSpan _processingInterval = TimeSpan.FromMinutes(5);

        public MlProcessingService(IServiceProvider services, ILogger<MlProcessingService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ML Processing Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessLogsAsync(stoppingToken);
                    await Task.Delay(_processingInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in ML processing");
                    // Continue despite errors
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
            }

            _logger.LogInformation("ML Processing Service stopped");
        }

        private async Task ProcessLogsAsync(CancellationToken cancellationToken)
        {
            using var scope = _services.CreateScope();
            var logRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();
            var clusteringService = scope.ServiceProvider.GetRequiredService<IIncidentClusteringService>();
            var forecastService = scope.ServiceProvider.GetRequiredService<IForecastService>();

            // Get recent logs (last hour)
            var recentLogs = (await logRepository.GetLogsSinceAsync(
                DateTime.UtcNow.AddHours(-1), cancellationToken)).ToList();

            if (recentLogs.Count == 0) return;

            // Perform clustering and create incidents
            _logger.LogInformation($"Processing {recentLogs.Count} logs for clustering");
            var incidents = await clusteringService.AnalyzeAndCreateIncidentsAsync(recentLogs);
            _logger.LogInformation($"Created {incidents.Count} incidents");

            // Perform forecasting
            _logger.LogInformation("Running forecast analysis");
            var allLogs = (await logRepository.GetAllAsync(limit: null, cancellationToken)).ToList();
            if (allLogs.Count >= 10)
            {
                var forecasts = await forecastService.ForecastWarningsAsync(24);
                if (forecasts.Count > 0)
                {
                    var alerts = await forecastService.GenerateAlertsAsync(forecasts);
                    _logger.LogInformation($"Generated {alerts.Count} forecast-based alerts");
                }
            }

            // Save changes
            var dbContext = scope.ServiceProvider.GetRequiredService<LogLensDbContext>();
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
