using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;
using LogLens.Domain.Enums;
using LogLens.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogLens.Infrastructure.Repositories
{
    public class LogRepository : ILogRepository
    {
        private readonly LogLensDbContext _context;

        public LogRepository(LogLensDbContext context)
        {
            _context = context;
        }

        public async Task AddRangeAsync(IEnumerable<LogEntry> entries, CancellationToken cancellationToken = default)
        {
            await _context.Logs.AddRangeAsync(entries, cancellationToken);
        }

        public async Task AddAsync(LogEntry entry, CancellationToken cancellationToken = default)
        {
            await _context.Logs.AddAsync(entry, cancellationToken);
        }

        public async Task<IEnumerable<LogEntry>> GetLogsSinceAsync(DateTime since, CancellationToken cancellationToken = default)
        {
            return await _context.Logs
                .Where(l => l.Timestamp >= since)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<LogEntry>> GetAllAsync(int? limit = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Logs.OrderByDescending(l => l.Timestamp).AsQueryable();
            if (limit.HasValue)
                query = query.Take(limit.Value);
            return await query.ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<(int Hour, int Errors, int Warnings, int Info)>> GetLogCountsByHourAsync(DateTime since, CancellationToken cancellationToken = default)
        {
            var logs = await _context.Logs
                .Where(l => l.Timestamp >= since)
                .Select(l => new { l.Timestamp, l.Level })
                .ToListAsync(cancellationToken);

            var result = new List<(int Hour, int Errors, int Warnings, int Info)>();
            for (var h = 0; h < 24; h++)
            {
                var hourLogs = logs.Where(l => l.Timestamp.Hour == h).ToList();
                var errors = hourLogs.Count(l => l.Level == LogLevel.Error || l.Level == LogLevel.Critical);
                var warnings = hourLogs.Count(l => l.Level == LogLevel.Warning);
                var info = hourLogs.Count(l => l.Level == LogLevel.Information || l.Level == LogLevel.Debug || l.Level == LogLevel.Trace);
                result.Add((h, errors, warnings, info));
            }
            return result;
        }
    }
}
