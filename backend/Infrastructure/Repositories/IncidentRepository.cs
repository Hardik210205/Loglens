using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;
using LogLens.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LogLens.Infrastructure.Repositories
{
    public class IncidentRepository : IIncidentRepository
    {
        private readonly LogLensDbContext _context;

        public IncidentRepository(LogLensDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Incident incident, CancellationToken cancellationToken = default)
        {
            await _context.AddAsync(incident, cancellationToken);
        }

        public async Task<IEnumerable<Incident>> GetRecentAsync(DateTime since, CancellationToken cancellationToken = default)
        {
            return await _context.Incidents
                .Include(i => i.LogEntries)
                .Where(i => i.StartTime >= since)
                .OrderByDescending(i => i.StartTime)
                .ToListAsync(cancellationToken);
        }
    }
}
