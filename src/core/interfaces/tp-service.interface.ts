/**
 * Interface definitions for the Targetprocess service layer
 * These interfaces allow for better testing, dependency injection, and future implementations
 */

import { ApiResponse } from '../../api/client/api.types.js';

/**
 * Search parameters for entity queries
 */
export interface SearchParams {
  where?: string;
  include?: string;
  take?: number;
  skip?: number;
  orderBy?: string;
}

/**
 * Entity data for creation
 */
export interface CreateEntityData {
  [key: string]: any;
}

/**
 * Entity data for updates
 */
export interface UpdateEntityData {
  [key: string]: any;
}

/**
 * Core Targetprocess service interface
 */
export interface ITPService {
  /**
   * Search for entities
   */
  searchEntities(entityType: string, params?: SearchParams): Promise<ApiResponse<any>>;
  
  /**
   * Get a single entity by ID
   */
  getEntity(entityType: string, id: number, include?: string): Promise<any>;
  
  /**
   * Create a new entity
   */
  createEntity(entityType: string, data: CreateEntityData): Promise<any>;
  
  /**
   * Update an existing entity
   */
  updateEntity(entityType: string, id: number, data: UpdateEntityData): Promise<any>;
  
  /**
   * Inspect object metadata
   */
  inspectObject(objectType?: string): Promise<any>;
  
  /**
   * Validate entity type
   */
  validateEntityType(entityType: string): Promise<boolean>;
  
  /**
   * Get valid entity types
   */
  getValidEntityTypes(): Promise<string[]>;
}

/**
 * Configuration for TPService
 */
export interface ITPServiceConfig {
  domain: string;
  credentials?: {
    username: string;
    password: string;
  };
  apiKey?: string;
}

/**
 * HTTP client interface for making API requests
 */
export interface ITPHttpClient {
  /**
   * Make a GET request
   */
  get<T = any>(url: string, params?: Record<string, any>): Promise<T>;
  
  /**
   * Make a POST request
   */
  post<T = any>(url: string, data: any, params?: Record<string, any>): Promise<T>;
  
  /**
   * Make a PUT request
   */
  put<T = any>(url: string, data: any, params?: Record<string, any>): Promise<T>;
  
  /**
   * Make a DELETE request
   */
  delete<T = any>(url: string, params?: Record<string, any>): Promise<T>;
}

/**
 * Authentication service interface
 */
export interface ITPAuthService {
  /**
   * Get authentication headers
   */
  getAuthHeaders(): Record<string, string>;
  
  /**
   * Validate authentication
   */
  validateAuth(): Promise<boolean>;
}