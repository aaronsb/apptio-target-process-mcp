/**
 * Error handling and logging interfaces
 * Provides abstraction for error management and logging
 */

import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Custom error types
 */
export enum TPErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  CONFIGURATION = 'CONFIGURATION',
  INTERNAL = 'INTERNAL'
}

/**
 * Error context information
 */
export interface IErrorContext {
  entityType?: string;
  entityId?: number;
  operation?: string;
  userId?: string;
  timestamp: Date;
  requestId?: string;
  [key: string]: any;
}

/**
 * Enhanced error interface
 */
export interface ITPError extends Error {
  type: TPErrorType;
  code: ErrorCode;
  context?: IErrorContext;
  innerError?: Error;
  isRetryable?: boolean;
  retryAfter?: number;
}

/**
 * Error handler interface
 */
export interface IErrorHandler {
  /**
   * Handle an error
   */
  handle(error: Error, context?: IErrorContext): ITPError;
  
  /**
   * Log an error
   */
  logError(error: ITPError): void;
  
  /**
   * Convert HTTP error to TP error
   */
  fromHttpError(status: number, message: string, context?: IErrorContext): ITPError;
  
  /**
   * Create validation error
   */
  validationError(message: string, context?: IErrorContext): ITPError;
  
  /**
   * Create not found error
   */
  notFoundError(entityType: string, id: number): ITPError;
  
  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean;
  
  /**
   * Get retry delay for error
   */
  getRetryDelay(error: Error, attempt: number): number;
}

/**
 * Logger interface
 */
export interface ILogger {
  /**
   * Log debug message
   */
  debug(message: string, data?: any): void;
  
  /**
   * Log info message
   */
  info(message: string, data?: any): void;
  
  /**
   * Log warning
   */
  warn(message: string, data?: any): void;
  
  /**
   * Log error
   */
  error(message: string, error?: Error, data?: any): void;
  
  /**
   * Create child logger with context
   */
  child(context: Record<string, any>): ILogger;
  
  /**
   * Set log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
}

/**
 * Metrics collector interface
 */
export interface IMetricsCollector {
  /**
   * Record a counter metric
   */
  increment(name: string, tags?: Record<string, string>): void;
  
  /**
   * Record a gauge metric
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  
  /**
   * Start a timer
   */
  startTimer(name: string): () => void;
  
  /**
   * Record operation duration
   */
  recordDuration(name: string, duration: number, tags?: Record<string, string>): void;
}