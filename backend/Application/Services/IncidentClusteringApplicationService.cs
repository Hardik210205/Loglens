using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;
using LogLens.Domain.Enums;
using LogLens.ML.Clustering;

namespace LogLens.Application.Services
{
    public class IncidentClusteringApplicationService : IIncidentClusteringService
    {
        private readonly IncidentClusteringService _mlService;
        private readonly IIncidentRepository _incidentRepository;
        private readonly ILogRepository _logRepository;

        public IncidentClusteringApplicationService(IIncidentRepository incidentRepository, ILogRepository logRepository)
        {
            _mlService = new IncidentClusteringService();
            _incidentRepository = incidentRepository;
            _logRepository = logRepository;
        }

        public async Task<List<Incident>> AnalyzeAndCreateIncidentsAsync(List<LogEntry> logs)
        {
            if (logs == null || logs.Count == 0)
                return new List<Incident>();

            // Get log groups from clustering
            var groups = _mlService.GroupLogsIntoIncidents(logs);

            var incidents = new List<Incident>();

            foreach (var group in groups)
            {
                if (group.Count == 0) continue;

                var maxSeverity = DetermineMaxSeverity(group);
                var incident = new Incident
                {
                    StartTime = group.Min(l => l.Timestamp),
                    EndTime = null, // Still ongoing
                    Description = GenerateIncidentDescription(group),
                    Severity = maxSeverity,
                    LogEntries = group
                };

                incidents.Add(incident);
                await _incidentRepository.AddAsync(incident);
            }

            return incidents;
        }

        public async Task<double> GetClusteringAccuracyAsync()
        {
            var logs = (await _logRepository.GetLogsSinceAsync(DateTime.UtcNow.AddDays(-7))).ToList();
            var quality = _mlService.ComputeClusteringQuality(logs);
            return Math.Round(quality, 2);
        }

        private SeverityLevel DetermineMaxSeverity(List<LogEntry> logs)
        {
            var levels = logs.Select(l => l.Level).ToList();
            if (levels.Contains(LogLevel.Critical)) return SeverityLevel.Critical;
            if (levels.Contains(LogLevel.Error)) return SeverityLevel.High;
            if (levels.Contains(LogLevel.Warning)) return SeverityLevel.Medium;
            return SeverityLevel.Low;
        }

        private string GenerateIncidentDescription(List<LogEntry> logs)
        {
            var criticalCount = logs.Count(l => l.Level == LogLevel.Critical || l.Level == LogLevel.Error);
            var warningCount = logs.Count(l => l.Level == LogLevel.Warning);
            return $"Incident with {criticalCount} errors and {warningCount} warnings. " +
                   $"Time span: {logs.Max(l => l.Timestamp) - logs.Min(l => l.Timestamp):hh\\:mm\\:ss}";
        }
    }
}
