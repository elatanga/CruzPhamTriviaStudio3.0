import { LogEntry, LogLevel } from '../types';

class LoggerService {
  private static instance: LoggerService;
  private currentSessionId: string | null = null;
  private currentUsername: string | null = null;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public setContext(sessionId: string | null, username: string | null) {
    this.currentSessionId = sessionId;
    this.currentUsername = username;
  }

  private createEntry(level: LogLevel, event: string, data?: any, error?: Error, correlationId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event,
      correlationId: correlationId || crypto.randomUUID(),
      sessionId: this.currentSessionId || undefined,
      username: this.currentUsername || undefined,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      } : undefined
    };
  }

  private dispatch(entry: LogEntry) {
    // In a real production app, this would perform an HTTP POST to an aggregator (Splunk, Datadog).
    // For this architecture, we output structured JSON to console for scraping
    // and store critical audit logs in localStorage for the Director panel.
    
    const colorMap = {
      debug: 'color: #888',
      info: 'color: #4CAF50',
      warn: 'color: #FFC107',
      error: 'color: #F44336',
      audit: 'color: #9C27B0; font-weight: bold'
    };

    console.groupCollapsed(`%c[${entry.level.toUpperCase()}] ${entry.event}`, colorMap[entry.level]);
    console.log(JSON.stringify(entry, null, 2));
    console.groupEnd();

    if (entry.level === 'audit' || entry.level === 'error') {
       // Persist strictly critical logs locally for the Director View
       try {
         const logs = JSON.parse(localStorage.getItem('cruzphamtrivia_audit_logs') || '[]');
         logs.unshift(entry);
         localStorage.setItem('cruzphamtrivia_audit_logs', JSON.stringify(logs.slice(0, 100)));
       } catch (e) { /* Ignore storage errors */ }
    }
  }

  public debug(event: string, data?: any, correlationId?: string) {
    this.dispatch(this.createEntry('debug', event, data, undefined, correlationId));
  }

  public info(event: string, data?: any, correlationId?: string) {
    this.dispatch(this.createEntry('info', event, data, undefined, correlationId));
  }

  public warn(event: string, data?: any, correlationId?: string) {
    this.dispatch(this.createEntry('warn', event, data, undefined, correlationId));
  }

  public error(event: string, error: Error, data?: any, correlationId?: string) {
    this.dispatch(this.createEntry('error', event, data, error, correlationId));
  }

  public audit(event: string, data?: any, correlationId?: string) {
    this.dispatch(this.createEntry('audit', event, data, undefined, correlationId));
  }
}

export const logger = LoggerService.getInstance();
