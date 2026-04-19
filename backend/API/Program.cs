using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using LogLens.Infrastructure.Data;
using LogLens.Application.Interfaces;
using LogLens.Application.Services;
using LogLens.API.Endpoints;
using LogLens.API.Hubs;
using LogLens.API.Middleware;
using LogLens.Infrastructure.BackgroundServices;
using LogLens.Infrastructure.Queue;
using LogLens.Infrastructure.Repositories;
using LogLens.ML.Clustering;
using LogLens.ML.Forecasting;

var builder = WebApplication.CreateBuilder(args);

// Serilog setup
builder.Host.UseSerilog((ctx, lc) =>
    lc.WriteTo.Console()
      .ReadFrom.Configuration(ctx.Configuration));

// configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ??
                       "Host=localhost;Port=5432;Database=loglens;Username=postgres;Password=postgres";

// EF Core with Npgsql
builder.Services.AddDbContext<LogLensDbContext>(opts =>
    opts.UseNpgsql(connectionString));

// health checks with detailed probes
builder.Services.AddHealthChecks()
    .AddDbContextCheck<LogLensDbContext>("PostgreSQL", failureStatus: HealthStatus.Unhealthy, tags: new[] { "db" })
    .AddCheck("memory", () => 
    {
        var memory = GC.GetTotalMemory(false);
        return memory < 1024 * 1024 * 1024 ? HealthCheckResult.Healthy() : HealthCheckResult.Degraded("High memory usage");
    }, tags: new[] { "system" });

// SignalR
builder.Services.AddSignalR()
    .AddMessagePackProtocol();

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "LogLens API",
        Version = "v1",
        Description = "Distributed log aggregation and predictive analytics platform",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "LogLens Team"
        }
    });
    c.EnableAnnotations();
});

// controllers
builder.Services.AddControllers();
builder.Services.AddMemoryCache();

// dependency injection
builder.Services.AddSingleton<LogChannel>();
builder.Services.AddSingleton<ILogQueueService, LogQueueService>();
builder.Services.AddScoped<ILogService, LogService>();

builder.Services.AddScoped<ILogRepository, LogRepository>();
builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<IForecastRepository, ForecastRepository>();
builder.Services.AddScoped<IAlertRepository, AlertRepository>();

// Add ML services
builder.Services.AddSingleton<IncidentClusteringService>();
builder.Services.AddSingleton<WarningForecastService>();
builder.Services.AddScoped<IIncidentClusteringService, IncidentClusteringApplicationService>();
builder.Services.AddScoped<IForecastService, ForecastApplicationService>();
builder.Services.AddSingleton<ILogSanitizer, LogSanitizer>();
builder.Services.AddScoped<ILogAnalyticsService, LogAnalyticsService>();
builder.Services.AddScoped<IRiskAnalysisService, RiskAnalysisService>();
builder.Services.AddScoped<IIncidentService, IncidentService>();

// background processing
builder.Services.AddHostedService<LogBatchInserter>();
builder.Services.AddHostedService<MlProcessingService>();

var app = builder.Build();

// Apply migrations at startup and fail fast on DB issues.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LogLensDbContext>();
    db.Database.Migrate();
}

// Swagger UI in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "LogLens API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowFrontend");

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/detailed", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = HealthCheckResponseWriter
});

app.MapLogEndpoints();
app.MapHub<LogHub>("/loghub");

app.Run();

// Custom health check response writer
static async Task HealthCheckResponseWriter(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";
    var response = new
    {
        status = report.Status.ToString(),
        checks = report.Entries.ToDictionary(
            x => x.Key,
            x => new { status = x.Value.Status.ToString(), exception = x.Value.Exception?.Message }
        ),
        duration = report.TotalDuration
    };
    
    await context.Response.WriteAsJsonAsync(response);
}