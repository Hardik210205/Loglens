using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.ML;
using Microsoft.ML.Data;
using LogLens.Domain.Entities;
using LogLens.Domain.Enums;

namespace LogLens.ML.Clustering
{
    public class IncidentClusteringService
    {
        private readonly MLContext _mlContext;
        private const int NumClusters = 5;

        public IncidentClusteringService()
        {
            _mlContext = new MLContext(seed: 0);
        }

        /// <summary>
        /// Clusters similar log entries using K-Means algorithm.
        /// Returns a mapping of log IDs to cluster IDs to group related logs into incidents.
        /// </summary>
        public Dictionary<Guid, int> ClusterLogs(List<LogEntry> logs)
        {
            if (logs == null || logs.Count == 0)
                return new Dictionary<Guid, int>();

            try
            {
                // Convert logs to feature vectors
                var logFeatures = logs.Select(log => new LogFeatureVector
                {
                    Id = log.Id.ToString(),
                    LevelScore = (float)ConvertLogLevelToScore(log.Level),
                    MessageLength = log.Message.Length,
                    TimestampTick = (float)(log.Timestamp.Ticks % 1000000), // normalized timestamp feature
                    MetadataLength = log.Metadata?.Length ?? 0
                }).ToList();

                // Create data view
                var dataView = _mlContext.Data.LoadFromEnumerable(logFeatures);

                // Define features for clustering
                var pipeline = _mlContext.Transforms.Concatenate("Features",
                    "LevelScore", "MessageLength", "TimestampTick", "MetadataLength")
                    .Append(_mlContext.Clustering.Trainers.KMeans(
                        numberOfClusters: NumClusters,
                        featureColumnName: "Features"));

                // Train the model
                var model = pipeline.Fit(dataView);

                // Make predictions
                var predictions = model.Transform(dataView);
                var predictionPath = _mlContext.Data.CreateEnumerable<LogClusterPrediction>(
                    predictions, reuseRowObject: false);

                // Build result mapping
                var result = new Dictionary<Guid, int>();
                foreach (var pred in predictionPath)
                {
                    if (Guid.TryParse(pred.Id, out var logId))
                    {
                        result[logId] = (int)pred.PredictedLabel;
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                // Log error and return empty mapping to prevent pipeline failure
                Console.WriteLine($"Error in clustering: {ex.Message}");
                return new Dictionary<Guid, int>();
            }
        }

        /// <summary>
        /// Tries to detect if logs represent the same incident by comparing features.
        /// Used to merge clusters and group into incidents.
        /// </summary>
        public List<List<LogEntry>> GroupLogsIntoIncidents(List<LogEntry> logs)
        {
            if (logs.Count == 0)
                return new List<List<LogEntry>>();

            var clusterAssignments = ClusterLogs(logs);
            var groups = logs.GroupBy(log => 
                clusterAssignments.TryGetValue(log.Id, out var cluster) ? cluster : 0)
                .Select(g => g.ToList())
                .ToList();

            return groups;
        }

        private int ConvertLogLevelToScore(LogLevel level) => level switch
        {
            LogLevel.Trace => 1,
            LogLevel.Debug => 2,
            LogLevel.Information => 3,
            LogLevel.Warning => 4,
            LogLevel.Error => 5,
            LogLevel.Critical => 6,
            _ => 0
        };
    }

    // Input and output classes for ML.NET
    public class LogFeatureVector
    {
        [LoadColumn(0)]
        public string Id { get; set; } = string.Empty;

        [LoadColumn(1)]
        public float LevelScore { get; set; }

        [LoadColumn(2)]
        public int MessageLength { get; set; }

        [LoadColumn(3)]
        public float TimestampTick { get; set; }

        [LoadColumn(4)]
        public int MetadataLength { get; set; }
    }

    public class LogClusterPrediction
    {
        [ColumnName("PredictedLabel")]
        public uint PredictedLabel { get; set; }

        public string Id { get; set; } = string.Empty;
    }
}
