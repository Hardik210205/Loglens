using System.Threading.Tasks;
using LogLens.Application.DTOs;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;

namespace LogLens.Application.Services
{
    public class LogService : Interfaces.ILogService
    {
        private readonly ILogQueueService _queueService;

        public LogService(ILogQueueService queueService)
        {
            _queueService = queueService;
        }

        public async Task EnqueueAsync(LogDto log)
        {
            var entry = new LogEntry
            {
                Timestamp = log.Timestamp,
                Level = log.Level,
                Message = log.Message,
                Metadata = log.Metadata
            };

            await _queueService.EnqueueAsync(entry);
        }
    }
}
