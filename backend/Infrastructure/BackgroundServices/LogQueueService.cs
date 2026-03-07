using System.Threading.Tasks;
using LogLens.Application.Interfaces;
using LogLens.Domain.Entities;
using LogLens.Infrastructure.Queue;

namespace LogLens.Infrastructure.BackgroundServices
{
    public class LogQueueService : ILogQueueService
    {
        public Task EnqueueAsync(LogEntry entry)
        {
            // write directly to the infrastructure channel
            return LogChannel.Channel.Writer.WriteAsync(entry).AsTask();
        }
    }
}
