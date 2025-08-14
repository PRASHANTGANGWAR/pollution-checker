import { config } from "../config/config";
import LogMeta from "../interfaces/logeMetaInterface";

type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * Logger utility for the application
 * Provides structured logging with different levels
 */
class Logger {
  private logLevel: LogLevel;
  private logLevels: Record<LogLevel, number>;

  constructor() {
    this.logLevel = (config.logging.level as LogLevel) || "info";
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  /**
   * Format log message with timestamp and level
   */
  private formatLog(
    level: LogLevel,
    message: string,
    meta: LogMeta = {}
  ): object {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...meta,
    };
  }

  error(message: string, meta: LogMeta = {}): void {
    if (this.shouldLog("error")) {
      console.error(
        JSON.stringify(this.formatLog("error", message, meta), null, 2)
      );
    }
  }

  warn(message: string, meta: LogMeta = {}): void {
    if (this.shouldLog("warn")) {
      console.warn(
        JSON.stringify(this.formatLog("warn", message, meta), null, 2)
      );
    }
  }

  info(message: string, meta: LogMeta = {}): void {
    if (this.shouldLog("info")) {
      console.info(
        JSON.stringify(this.formatLog("info", message, meta), null, 2)
      );
    }
  }

  debug(message: string, meta: LogMeta = {}): void {
    if (this.shouldLog("debug")) {
      console.log(
        JSON.stringify(this.formatLog("debug", message, meta), null, 2)
      );
    }
  }

  logRequest(
    method: string,
    url: string,
    params: LogMeta = {},
    headers: LogMeta = {}
  ): void {
    this.info("API Request", {
      method,
      url,
      params,
      headers: this.sanitizeHeaders(headers),
    });
  }

  logResponse(
    method: string,
    url: string,
    status: number,
    responseTime: number,
    data: unknown = {}
  ): void {
    this.info("API Response", {
      method,
      url,
      status,
      responseTime: `${responseTime}ms`,
      dataSize: Array.isArray(data) ? data.length : "N/A",
    });
  }

  logError(
    method: string,
    url: string,
    status: number,
    message: string,
    data: unknown = {}
  ): void {
    this.error("API Error", {
      method,
      url,
      status,
      message,
      data,
    });
  }

  private sanitizeHeaders(headers: LogMeta): LogMeta {
    const sanitized = { ...headers };
    const sensitiveKeys = ["authorization", "cookie", "x-api-key"];

    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  logAuth(event: string, meta: LogMeta = {}): void {
    this.info(`Authentication: ${event}`, meta);
  }

  logTokenRefresh(event: string, meta: LogMeta = {}): void {
    this.info(`Token Refresh: ${event}`, meta);
  }
}

export default new Logger();
