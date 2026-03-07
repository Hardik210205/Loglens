using System;
using System.Collections.Generic;
using LogLens.Domain.Enums;

namespace LogLens.Domain.Entities
{
    public class Incident
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public string Description { get; set; } = string.Empty;
        public SeverityLevel Severity { get; set; }

        // relation: an incident may be associated with many log entries
        public ICollection<LogEntry> LogEntries { get; set; } = new List<LogEntry>();
    }
}
