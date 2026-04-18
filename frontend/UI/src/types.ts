export type LogLevel = "Info" | "Warning" | "Error" | "Debug";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  metadata?: string;
}
