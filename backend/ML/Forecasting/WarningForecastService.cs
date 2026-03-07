using System;
using System.Collections.Generic;
using System.Linq;
using LogLens.Domain.Entities;
using LogLens.Domain.Enums;

namespace LogLens.ML.Forecasting
{
    public class WarningForecastService
    {
        private const int ForecastHorizon = 24; // hours ahead to forecast

        public WarningForecastService()
        {
        }

        /// <summary>
        /// Predicts future warning/error counts based on historical frequency.
        /// Uses simple exponential smoothing for forecasting.
        /// </summary>
        public List<ForecastResult> ForecastWarnings(List<LogEntry> logs, int hoursAhead = ForecastHorizon)
        {
            if (logs.Count == 0)
                return new List<ForecastResult>();

            try
            {
                // Aggregate logs by hour and count warnings/errors
                var hourlyWarnings = AggregateWarningsByHour(logs);
                
                if (hourlyWarnings.Count < 2)
                    return new List<ForecastResult>();

                var data = hourlyWarnings.OrderBy(x => x.Key).ToList();
                var values = data.Select(x => (double)x.Value).ToArray();

                // Calculate moving average and trend
                var results = SimpleExponentialSmoothing(values, hoursAhead);
                
                var baseTime = DateTime.UtcNow;
                var forecastResults = results.Select((value, index) => new ForecastResult
                {
                    Timestamp = baseTime.AddHours(index),
                    Value = Math.Max(0, value),
                    ConfidenceLower = Math.Max(0, value * 0.8),
                    ConfidenceUpper = Math.Max(0, value * 1.2)
                }).ToList();

                return forecastResults;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in forecasting: {ex.Message}");
                return new List<ForecastResult>();
            }
        }

        /// <summary>
        /// Calculates if a forecast indicates potential incident (predicted value > threshold)
        /// and generates alerts accordingly.
        /// </summary>
        public List<Alert> GenerateAlertsFromForecast(List<ForecastResult> forecasts, double thresholdMultiplier = 1.5)
        {
            var alerts = new List<Alert>();

            if (forecasts.Count == 0) return alerts;

            var average = forecasts.Average(f => f.Value);

            foreach (var forecast in forecasts)
            {
                if (forecast.Value > average * thresholdMultiplier)
                {
                    alerts.Add(new Alert
                    {
                        Message = $"Predicted high warning volume: {forecast.Value:F2} logs expected",
                        Severity = forecast.Value > average * 2 ? SeverityLevel.Critical : SeverityLevel.High,
                        Timestamp = forecast.Timestamp
                    });
                }
            }

            return alerts;
        }

        /// <summary>
        /// Simple exponential smoothing for time series forecasting.
        /// </summary>
        private List<double> SimpleExponentialSmoothing(double[] values, int horizon)
        {
            const double alpha = 0.3; // smoothing factor
            var forecast = new List<double>();

            if (values.Length == 0) return forecast;

            // Initialize with first value
            double level = values[0];
            double trend = 0;

            // Calculate smoothed values
            for (int i = 1; i < values.Length; i++)
            {
                double prevLevel = level;
                level = alpha * values[i] + (1 - alpha) * (prevLevel + trend);
                trend = 0.1 * (level - prevLevel) + 0.9 * trend;
            }

            // Generate forecasts
            for (int i = 0; i < horizon; i++)
            {
                forecast.Add(Math.Max(0, level + trend * (i + 1)));
            }

            return forecast;
        }

        private Dictionary<DateTime, int> AggregateWarningsByHour(List<LogEntry> logs)
        {
            return logs
                .Where(log => log.Level == LogLevel.Warning || log.Level == LogLevel.Error || log.Level == LogLevel.Critical)
                .GroupBy(log => new DateTime(log.Timestamp.Year, log.Timestamp.Month, log.Timestamp.Day, log.Timestamp.Hour, 0, 0))
                .OrderBy(g => g.Key)
                .ToDictionary(g => g.Key, g => g.Count());
        }
    }

    public class ForecastResult
    {
        public DateTime Timestamp { get; set; }
        public double Value { get; set; }
        public double ConfidenceLower { get; set; }
        public double ConfidenceUpper { get; set; }
    }
}
