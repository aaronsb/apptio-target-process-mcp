/**
 * Configuration interfaces for the MCP server
 * Provides abstraction for configuration management
 */

/**
 * Authentication configuration
 */
export interface IAuthConfig {
  type: 'basic' | 'apikey';
  credentials?: {
    username: string;
    password: string;
  };
  apiKey?: string;
}

/**
 * Connection configuration
 */
export interface IConnectionConfig {
  domain: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Cache configuration
 */
export interface ICacheConfig {
  enabled: boolean;
  ttl?: number;
  maxSize?: number;
}

/**
 * Logging configuration
 */
export interface ILoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format?: 'json' | 'text';
  destination?: 'console' | 'file';
  filePath?: string;
}

/**
 * Complete application configuration
 */
export interface IAppConfig {
  auth: IAuthConfig;
  connection: IConnectionConfig;
  cache?: ICacheConfig;
  logging?: ILoggingConfig;
  features?: {
    [key: string]: boolean;
  };
}

/**
 * Configuration service interface
 */
export interface IConfigService {
  /**
   * Get complete configuration
   */
  getConfig(): IAppConfig;
  
  /**
   * Get authentication config
   */
  getAuthConfig(): IAuthConfig;
  
  /**
   * Get connection config
   */
  getConnectionConfig(): IConnectionConfig;
  
  /**
   * Get cache config
   */
  getCacheConfig(): ICacheConfig;
  
  /**
   * Get logging config
   */
  getLoggingConfig(): ILoggingConfig;
  
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: string): boolean;
  
  /**
   * Validate configuration
   */
  validate(): Promise<boolean>;
  
  /**
   * Reload configuration
   */
  reload(): Promise<void>;
}

/**
 * Configuration loader interface
 */
export interface IConfigLoader {
  /**
   * Load configuration from source
   */
  load(): Promise<IAppConfig>;
  
  /**
   * Check if configuration exists
   */
  exists(): Promise<boolean>;
}

/**
 * Environment configuration loader
 */
export interface IEnvConfigLoader extends IConfigLoader {
  /**
   * Get required environment variables
   */
  getRequiredVars(): string[];
  
  /**
   * Validate environment variables
   */
  validateEnv(): boolean;
}

/**
 * File configuration loader
 */
export interface IFileConfigLoader extends IConfigLoader {
  /**
   * Get configuration file paths
   */
  getConfigPaths(): string[];
  
  /**
   * Find configuration file
   */
  findConfigFile(): Promise<string | null>;
}