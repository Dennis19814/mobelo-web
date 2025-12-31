/**
 * Centralized Logging Service
 * Replaces scattered console.* statements with structured logging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, contextFn?: () => LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = contextFn ? ` ${JSON.stringify(contextFn())}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context ? () => context : undefined));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context ? () => context : undefined));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context ? () => context : undefined));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message, context ? () => context : undefined));
    }
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.debug(`${method} ${url}`, context);
  }

  apiResponse(method: string, url: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    const message = `${method} ${url} - ${status}`;

    if (level === LogLevel.ERROR) {
      this.error(message, context);
    } else {
      this.debug(message, context);
    }
  }

  apiError(method: string, url: string, error: any): void {
    this.error(`${method} ${url} failed`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for context
export type { LogContext };