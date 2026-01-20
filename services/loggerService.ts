
import { LogEntry, LogLevel } from '../types';

class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  // Simple console wrapper
  public debug(event: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${event}`, data);
    }
  }

  public info(event: string, data?: any) {
    console.info(`[INFO] ${event}`, data);
  }

  public warn(event: string, data?: any) {
    console.warn(`[WARN] ${event}`, data);
  }

  public error(event: string, error: Error, data?: any) {
    console.error(`[ERROR] ${event}`, error, data);
  }

  public audit(event: string, data?: any) {
    console.log(`%c[AUDIT] ${event}`, 'color: #9C27B0; font-weight: bold', data);
  }
}

export const logger = LoggerService.getInstance();
export default LoggerService;
