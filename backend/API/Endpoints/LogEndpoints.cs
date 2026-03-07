using System;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using LogLens.Application.DTOs;
using LogLens.Application.Interfaces;
using LogLens.Domain.Enums;

namespace LogLens.API.Endpoints
{
    public static class LogEndpoints
    {
        public static void MapLogEndpoints(this WebApplication app)
        {
            app.MapPost("/api/logs", async (LogDto log, ILogService logService) =>
            {
                await logService.EnqueueAsync(log);
                return Results.Accepted();
            })
            .WithName("IngestLog")
            .WithTags("Logs");

            app.MapGet("/api/logs", async (ILogRepository logRepo, int? limit) =>
            {
                var logs = await logRepo.GetAllAsync(limit ?? 1000);
                var dtos = logs.Select(l => new LogResponseDto(
                    l.Id,
                    l.Timestamp,
                    l.Level.ToString(),
                    l.Message,
                    l.Metadata
                )).ToList();
                return Results.Ok(dtos);
            })
            .WithName("GetLogs")
            .WithTags("Logs");

            app.MapGet("/api/incidents", async (IIncidentRepository incidentRepo) =>
            {
                var since = DateTime.UtcNow.AddHours(-24);
                var incidents = await incidentRepo.GetRecentAsync(since);
                var dtos = incidents.Select(i => new IncidentResponseDto(
                    i.Id,
                    i.StartTime,
                    i.EndTime,
                    i.Description,
                    MapSeverity(i.Severity),
                    i.LogEntries?.Count ?? 0
                )).ToList();
                return Results.Ok(dtos);
            })
            .WithName("GetIncidents")
            .WithTags("Incidents");

            app.MapGet("/api/stats/heatmap", async (ILogRepository logRepo) =>
            {
                var since = DateTime.UtcNow.AddHours(-24);
                var counts = await logRepo.GetLogCountsByHourAsync(since);
                var dtos = counts.Select(c => new HeatmapResponseDto(
                    $"{c.Hour:D2}:00",
                    c.Errors,
                    c.Warnings,
                    c.Info
                )).ToList();
                return Results.Ok(dtos);
            })
            .WithName("GetHeatmap")
            .WithTags("Stats");

            app.MapGet("/api/stats/dashboard", async (
                ILogRepository logRepo,
                IIncidentRepository incidentRepo,
                IAlertRepository alertRepo,
                IForecastRepository forecastRepo) =>
            {
                var since = DateTime.UtcNow.AddHours(-24);
                var logs24h = (await logRepo.GetLogsSinceAsync(since)).Count();
                var incidents = (await incidentRepo.GetRecentAsync(since)).ToList();
                var activeIncidents = incidents.Count(i => i.EndTime == null);
                var alerts24h = await alertRepo.GetCountSinceAsync(since);
                var healthPercent = logs24h > 0
                    ? Math.Max(0, 100 - (int)((double)(incidents.Count * 5) / logs24h * 100))
                    : 100;
                var dto = new DashboardStatsDto(logs24h, activeIncidents, alerts24h, Math.Min(100, healthPercent));
                return Results.Ok(dto);
            })
            .WithName("GetDashboardStats")
            .WithTags("Stats");

            app.MapGet("/api/stats/ai", async (
                IIncidentRepository incidentRepo,
                IForecastRepository forecastRepo) =>
            {
                var since = DateTime.UtcNow.AddHours(-24);
                var incidents = await incidentRepo.GetRecentAsync(since);
                var incidentCount = incidents.Count();
                var forecastCount = await forecastRepo.GetCountSinceAsync(since);
                var dto = new AIStatusDto(
                    ClusteringAccuracy: 82,
                    ForecastingAccuracy: 80,
                    IncidentsDetected: incidentCount,
                    ForecastsGenerated: forecastCount,
                    LastUpdate: DateTime.UtcNow
                );
                return Results.Ok(dto);
            })
            .WithName("GetAIStatus")
            .WithTags("Stats");
        }

        private static string MapSeverity(SeverityLevel s)
        {
            return s switch
            {
                SeverityLevel.Critical => "Critical",
                SeverityLevel.High => "Major",
                SeverityLevel.Medium => "Minor",
                SeverityLevel.Low => "Low",
                _ => "Low"
            };
        }
    }
}
