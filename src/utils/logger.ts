/**
 * Strict MCP Logger
 * 
 * Ensures all logging goes to stderr to avoid breaking JSON-RPC protocol on stdio.
 * Claude Desktop and other MCP clients expect pure JSON-RPC on stdout.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

class StrictMCPLogger implements Logger {
  private isStrictMode: boolean;

  constructor() {
    // Enable strict mode via environment variable or auto-detect MCP server mode
    this.isStrictMode = process.env.MCP_STRICT_MODE === 'true' || 
                       process.argv.includes('--stdio') ||
                       process.stdin.isTTY === false;
    
    if (this.isStrictMode) {
      this.info('MCP Strict Mode enabled - all logging redirected to stderr');
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (this.isStrictMode) {
      // In strict mode, ALL output goes to stderr to preserve stdio for JSON-RPC
      process.stderr.write(logMessage + '\n');
      if (args.length > 0) {
        process.stderr.write(`  Args: ${JSON.stringify(args)}\n`);
      }
    } else {
      // Development mode - use console normally
      switch (level) {
        case 'debug':
          console.debug(logMessage, ...args);
          break;
        case 'info':
          console.info(logMessage, ...args);
          break;
        case 'warn':
          console.warn(logMessage, ...args);
          break;
        case 'error':
          console.error(logMessage, ...args);
          break;
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}

// Export singleton logger instance
export const logger = new StrictMCPLogger();

// Export helper to replace console logging
export const createLogger = (component: string): Logger => {
  return {
    debug: (message: string, ...args: any[]) => logger.debug(`[${component}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => logger.info(`[${component}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(`[${component}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => logger.error(`[${component}] ${message}`, ...args),
  };
};