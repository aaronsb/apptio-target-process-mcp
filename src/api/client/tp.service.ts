import fetch, { Response } from 'node-fetch';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { URLSearchParams } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { AssignableEntityData } from '../../entities/assignable/assignable.entity.js';
import { UserStoryData } from '../../entities/assignable/user-story.entity.js';
import { ApiResponse, CreateEntityRequest, UpdateEntityRequest } from './api.types.js';

type OrderByOption = string | { field: string; direction: 'asc' | 'desc' };

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffFactor: number;
}

interface ApiErrorResponse {
  Message?: string;
  ErrorMessage?: string;
  Description?: string;
}

export interface TPServiceConfig {
  domain: string;
  credentials: {
    username: string;
    password: string;
  };
  retry?: RetryConfig;
}

/**
 * Service layer for interacting with TargetProcess API
 */
export class TPService {
  private readonly baseUrl: string;
  private readonly auth: string;

  private readonly retryConfig: RetryConfig;

  /**
   * Formats a value for use in a where clause based on its type
   */
  private formatWhereValue(value: unknown): string {
    if (value === null) {
      return 'null';
    }

    if (typeof value === 'boolean') {
      return value.toString().toLowerCase();
    }

    if (value instanceof Date) {
      return `'${value.toISOString().split('T')[0]}'`;
    }

    if (Array.isArray(value)) {
      return `[${value.map(v => this.formatWhereValue(v)).join(',')}]`;
    }

    // Handle strings
    const strValue = String(value);
    
    // Remove any existing quotes
    const unquoted = strValue.replace(/^['"]|['"]$/g, '');
    
    // Escape single quotes by doubling them
    const escaped = unquoted.replace(/'/g, "''");
    
    // Always wrap in single quotes as per TargetProcess API requirements
    return `'${escaped}'`;
  }

  /**
   * Formats a field name for use in a where clause
   */
  private formatWhereField(field: string): string {
    // Handle custom fields that match native fields
    if (field.startsWith('CustomField.')) {
      return `cf_${field.substring(12)}`;
    }

    // Remove spaces from custom field names
    return field.replace(/\s+/g, '');
  }

  /**
   * Validates and formats a where clause according to TargetProcess rules
   */
  private validateWhereClause(where: string): string {
    try {
      // Handle empty/null cases
      if (!where || !where.trim()) {
        throw new McpError(ErrorCode.InvalidRequest, 'Empty where clause');
      }

      // Split on 'and' while preserving quoted strings
      const conditions: string[] = [];
      let currentCondition = '';
      let inQuote = false;
      let quoteChar = '';

      for (let i = 0; i < where.length; i++) {
        const char = where[i];
        
        if ((char === "'" || char === '"') && where[i - 1] !== '\\') {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          }
        }

        if (!inQuote && where.slice(i, i + 4).toLowerCase() === ' and') {
          conditions.push(currentCondition.trim());
          currentCondition = '';
          i += 3; // Skip 'and'
          continue;
        }

        currentCondition += char;
      }
      conditions.push(currentCondition.trim());

      return conditions.map(condition => {
        // Handle null checks
        if (/\bis\s+null\b/i.test(condition)) {
          const field = condition.split(/\bis\s+null\b/i)[0].trim();
          return `${this.formatWhereField(field)} is null`;
        }
        if (/\bis\s+not\s+null\b/i.test(condition)) {
          const field = condition.split(/\bis\s+not\s+null\b/i)[0].trim();
          return `${this.formatWhereField(field)} is not null`;
        }

        // Match field and operator while preserving quoted values
        const match = condition.match(/^([^\s]+)\s+(eq|ne|gt|gte|lt|lte|in|contains|not\s+contains)\s+(.+)$/i);
        if (!match) {
          throw new McpError(ErrorCode.InvalidRequest, `Invalid condition format: ${condition}`);
        }

        const [, field, operator, value] = match;
        const formattedField = this.formatWhereField(field);
        const formattedValue = this.formatWhereValue(value.trim());

        return `${formattedField} ${operator.toLowerCase()} ${formattedValue}`;
      }).join(' and ');
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Invalid where clause: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Formats orderBy parameters according to TargetProcess rules
   */
  private formatOrderBy(orderBy: OrderByOption[]): string {
    return orderBy.map(item => {
      if (typeof item === 'string') {
        return this.formatWhereField(item);
      }
      return `${this.formatWhereField(item.field)} ${item.direction}`;
    }).join(',');
  }

  /**
   * Validates and formats include parameters
   */
  private validateInclude(include: string[]): string {
    const validIncludes = include
      .filter(Boolean)
      .map(i => i.trim())
      .map(i => this.formatWhereField(i));

    validIncludes.forEach(inc => {
      if (!/^[A-Za-z.]+$/.test(inc)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid include parameter: ${inc}`
        );
      }
    });

    return `[${validIncludes.join(',')}]`;
  }

  constructor(config: TPServiceConfig) {
    const { domain, credentials: { username, password }, retry } = config;
    this.baseUrl = `https://${domain}/api/v1`;
    this.auth = Buffer.from(`${username}:${password}`).toString('base64');
    this.retryConfig = retry || {
      maxRetries: 3,
      delayMs: 1000,
      backoffFactor: 2
    };
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.delayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on 400 (bad request) or 401 (unauthorized)
        if (error instanceof McpError && 
            (error.message.includes('status: 400') || 
             error.message.includes('status: 401'))) {
          throw error;
        }

        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Wait before retrying
        await setTimeout(delay);
        delay *= this.retryConfig.backoffFactor;
      }
    }

    throw new McpError(
      ErrorCode.InvalidRequest,
      `Failed to ${context} after ${this.retryConfig.maxRetries} attempts: ${lastError?.message}`
    );
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const data = await response.json() as ApiErrorResponse;
      return data.Message || data.ErrorMessage || data.Description || response.statusText;
    } catch {
      return response.statusText;
    }
  }

  /**
   * Search entities with filtering and includes
   */
  private async handleApiResponse<T>(
    response: Response,
    context: string
  ): Promise<T> {
    if (!response.ok) {
      const errorMessage = await this.extractErrorMessage(response);
      throw new McpError(
        ErrorCode.InvalidRequest,
        `${context} failed: ${response.status} - ${errorMessage}`
      );
    }
    return await response.json() as T;
  }

  async searchEntities<T>(
    type: string,
    where?: string,
    include?: string[],
    take: number = 25,
    orderBy?: string[]
  ): Promise<T[]> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        take: take.toString()
      });

      if (where) {
        params.append('where', this.validateWhereClause(where));
      }

      if (include?.length) {
        params.append('include', this.validateInclude(include));
      }

      if (orderBy?.length) {
        params.append('orderBy', this.formatOrderBy(orderBy as OrderByOption[]));
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseUrl}/${type}s?${params}`, {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json'
          }
        });

        const data = await this.handleApiResponse<ApiResponse<T>>(
          response,
          `search ${type}s`
        );
        return data.Items || [];
      }, `search ${type}s`);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to search ${type}s: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a single entity by ID
   */
  async getEntity<T>(
    type: string,
    id: number,
    include?: string[]
  ): Promise<T> {
    try {
      const params = new URLSearchParams({
        format: 'json'
      });

      if (include?.length) {
        params.append('include', this.validateInclude(include));
      }

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseUrl}/${type}s/${id}?${params}`, {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json'
          }
        });

        return await this.handleApiResponse<T>(
          response,
          `get ${type} ${id}`
        );
      }, `get ${type} ${id}`);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get ${type} ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new entity
   */
  async createEntity<T>(
    type: string,
    data: CreateEntityRequest
  ): Promise<T> {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseUrl}/${type}s`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        return await this.handleApiResponse<T>(
          response,
          `create ${type}`
        );
      }, `create ${type}`);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to create ${type}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity<T>(
    type: string,
    id: number,
    data: UpdateEntityRequest
  ): Promise<T> {
    try {
      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseUrl}/${type}s/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        return await this.handleApiResponse<T>(
          response,
          `update ${type} ${id}`
        );
      }, `update ${type} ${id}`);
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to update ${type} ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper method to get user stories with related data
   */
  async getUserStories(
    where?: string,
    include: string[] = ['Project', 'Team', 'Feature', 'Tasks', 'Bugs']
  ): Promise<(UserStoryData & AssignableEntityData)[]> {
    const results = await this.searchEntities<UserStoryData & AssignableEntityData>(
      'UserStory',
      where,
      include
    );
    return results;
  }

  /**
   * Helper method to get a single user story with related data
   */
  async getUserStory(
    id: number,
    include: string[] = ['Project', 'Team', 'Feature', 'Tasks', 'Bugs']
  ): Promise<UserStoryData & AssignableEntityData> {
    const result = await this.getEntity<UserStoryData & AssignableEntityData>(
      'UserStory',
      id,
      include
    );
    return result;
  }
}
