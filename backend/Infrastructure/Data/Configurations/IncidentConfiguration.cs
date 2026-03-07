using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using LogLens.Domain.Entities;

namespace LogLens.Infrastructure.Data.Configurations
{
    public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
    {
        public void Configure(EntityTypeBuilder<Incident> builder)
        {
            builder.ToTable("incidents");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.StartTime).IsRequired();
            builder.Property(i => i.Description).HasMaxLength(2000);
            builder.Property(i => i.Severity).IsRequired();

            builder.HasMany(i => i.LogEntries)
                   .WithOne()
                   .HasForeignKey("IncidentId");

            // Add indexes for common queries
            builder.HasIndex(i => new { i.StartTime, i.Severity })
                .HasName("idx_incidents_starttime_severity");

            builder.HasIndex(i => i.Severity)
                .HasName("idx_incidents_severity");

            builder.HasIndex(i => i.StartTime)
                .HasName("idx_incidents_starttime")
                .IsDescending();
        }
    }
}