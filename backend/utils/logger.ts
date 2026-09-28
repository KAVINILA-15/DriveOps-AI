/**
 * Lightweight structured logger for DriveOps-AI backend
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[DriveOps-AI] [${timestamp}] [${level.toUpperCase()}]:`;
  if (meta !== undefined) {
    if (level === 'error') {
      console.error(prefix, message, meta);
    } else if (level === 'warn') {
      console.warn(prefix, message, meta);
    } else {
      console.log(prefix, message, meta);
    }
  } else {
    if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }
}

export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, meta?: any) => log('error', msg, meta),
  debug: (msg: string, meta?: any) => log('debug', msg, meta),
};
