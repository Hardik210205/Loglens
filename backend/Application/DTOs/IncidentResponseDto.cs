using System;

namespace LogLens.Application.DTOs
{
    public record IncidentResponseDto(
        Guid Id,
        DateTime StartTime,
        DateTime? EndTime,
        string Description,
        string Severity,
        int LogCount
    );
}
