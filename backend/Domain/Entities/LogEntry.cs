using System;
using LogLens.Domain.Enums;

namespace LogLens.Domain.Entities
{
    public class LogEntry
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public LogLevel Level { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Metadata { get; set; }
    }
}
