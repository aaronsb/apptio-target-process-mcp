import fetch, { Response } from 'node-fetch';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { URLSearchParams } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { AssignableEntityData } from '../../entities/assignable/assignable.entity.js';
import { UserStoryData } from '../../entities/assignable/user-story.entity.js';
import { ApiResponse, CreateEntityRequest, UpdateEntityRequest } from './api.types.js';
import { EntityRegistry, EntityCategory } from '../../core/entity-registry.js';
import { logger } from '../../utils/logger.js';

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

interface TPServiceCommonConfig {
  domain: string;
  retry?: RetryConfig;
}

interface TPServiceApiKeyConfig extends TPServiceCommonConfig {
  apiKey: string;
}

interface TPServiceBasicAuthConfig extends TPServiceCommonConfig {
  credentials: {
    username: string;
    password: string;
  };
}

export type TPServiceConfig = TPServiceApiKeyConfig | TPServiceBasicAuthConfig;

function isApiKeyConfig(config: TPServiceConfig): config is TPServiceApiKeyConfig {
  return (config as TPServiceApiKeyConfig).apiKey !== undefined;
}


/**
 * Service layer for interacting with TargetProcess API
 */
export class TPService {
  private readonly baseUrl: string;
  private readonly auth: string;
  private authType: 'basic' | 'apikey' = 'basic';

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
   * TargetProcess API only accepts field names, no direction keywords
   */
  private formatOrderBy(orderBy: OrderByOption[]): string {
    return orderBy.map(item => {
      if (typeof item === 'string') {
        // Remove any direction keywords that might be present
        const fieldName = item.replace(/\s+(desc|asc)$/i, '').trim();
        return fieldName; // Don't use formatWhereField for orderBy - just return clean field name
      }
      return item.field; // For object format, just return the field name
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
    if (isApiKeyConfig(config)) {
      this.auth = config.apiKey
      this.authType = 'apikey';
    } else {
      this.auth = Buffer.from(`${config.credentials.username}:${config.credentials.password}`).toString('base64');
      this.authType = 'basic';
    }

    this.baseUrl = `https://${config.domain}/api/v1`;
    this.retryConfig = config.retry || {
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

  // Cache for valid entity types to avoid repeated API calls
  private validEntityTypesCache: string[] | null = null;
  private cacheInitPromise: Promise<string[]> | null = null;
  private readonly cacheExpiryMs = 3600000; // Cache expires after 1 hour
  private cacheTimestamp: number = 0;

  /**
   * Validates that the entity type is supported by Target Process
   * Uses dynamic validation with caching for better accuracy
   */
  private async validateEntityType(type: string): Promise<string> {
    // Static list of known entity types from registry as fallback
    const staticValidEntityTypes = EntityRegistry.getAllEntityTypes();

    try {
      // Check if cache is expired
      const isCacheExpired = Date.now() - this.cacheTimestamp > this.cacheExpiryMs;

      // Initialize cache if needed
      if (!this.validEntityTypesCache || isCacheExpired) {
        // If initialization is already in progress, wait for it
        if (this.cacheInitPromise) {
          this.validEntityTypesCache = await this.cacheInitPromise;
        } else {
          // Start new initialization
          this.cacheInitPromise = this.getValidEntityTypes();
          try {
            this.validEntityTypesCache = await this.cacheInitPromise;
            this.cacheTimestamp = Date.now();
          } catch (error) {
            logger.error('Failed to fetch valid entity types:', error);
            // Fall back to static list if API call fails
            this.validEntityTypesCache = staticValidEntityTypes;
          } finally {
            this.cacheInitPromise = null;
          }
        }
      }

      // Validate against the cache
      if (!this.validEntityTypesCache.includes(type)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid entity type: '${type}'. Valid entity types are: ${this.validEntityTypesCache.join(', ')}`
        );
      }

      return type;
    } catch (error) {
      // If error is already a McpError, rethrow it
      if (error instanceof McpError) {
        throw error;
      }

      // Fall back to static validation if dynamic validation fails
      if (!staticValidEntityTypes.includes(type)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid entity type: '${type}'. Valid entity types are: ${staticValidEntityTypes.join(', ')}`
        );
      }

      return type;
    }
  }

  async searchEntities<T>(
    type: string,
    where?: string,
    include?: string[],
    take: number = 25,
    orderBy?: string[]
  ): Promise<T[]> {
    try {
      // Validate entity type (now async)
      const validatedType = await this.validateEntityType(type);

      const params = this.getQueryParams({
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
        // Special case for TimeSheet entity which uses 'time' endpoint instead of 'TimeSheets'
        const endpoint = validatedType === 'TimeSheet' ? 'time' : `${validatedType}s`;
        const response = await fetch(`${this.baseUrl}/${endpoint}?${params}`, {
          headers: this.getHeaders()
        });

        const data = await this.handleApiResponse<ApiResponse<T>>(
          response,
          `search ${validatedType}s`
        );
        return data.Items || [];
      }, `search ${validatedType}s`);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to search ${type}s: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get comments for an entity
   */
  async getComments(entityType: string, entityId: number): Promise<any[]> {
    try {
      // Validate entity type
      const validatedType = await this.validateEntityType(entityType);

      return await this.executeWithRetry(async () => {
        const response = await fetch(`${this.baseUrl}/${validatedType}/${entityId}/Comments`, {
          headers: this.getHeaders()
        });

        const data = await this.handleApiResponse<ApiResponse<any>>(
          response,
          `get comments for ${validatedType} ${entityId}`
        );
        
        // Return the Items array, or empty array if no Items property
        return data.Items || [];
      }, `get comments for ${validatedType} ${entityId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get comments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a comment by ID
   */
  async deleteComment(commentId: number): Promise<boolean> {
    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseUrl}/Comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (response.ok) {
        return true;
      } else {
        const errorText = await this.extractErrorMessage(response);
        throw new Error(`Failed to delete comment ${commentId}: ${response.status} - ${errorText}`);
      }
    }, `delete comment ${commentId}`);
  }

  /**
   * Create a comment on an entity
   */
  async createComment(entityId: number, description: string, isPrivate?: boolean, parentCommentId?: number): Promise<any> {
    const commentData: any = {
      General: { Id: entityId },
      Description: description
    };

    if (isPrivate) {
      commentData.IsPrivate = true;
    }

    if (parentCommentId) {
      commentData.ParentId = parentCommentId;
    }

    return await this.executeWithRetry(async () => {
      const response = await fetch(`${this.baseUrl}/Comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders()
        },
        body: JSON.stringify(commentData)
      });

      return await this.handleApiResponse<any>(
        response,
        `create comment on entity ${entityId}`
      );
    }, `create comment on entity ${entityId}`);
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
      // Validate entity type (now async)
      const validatedType = await this.validateEntityType(type);

      const params = this.getQueryParams({
        format: 'json'
      });

      if (include?.length) {
        params.append('include', this.validateInclude(include));
      }

      return await this.executeWithRetry(async () => {
        // Special case for TimeSheet entity which uses 'time' endpoint instead of 'TimeSheets'
        const endpoint = validatedType === 'TimeSheet' ? 'time' : `${validatedType}s`;
        const response = await fetch(`${this.baseUrl}/${endpoint}/${id}?${params}`, {
          headers: this.getHeaders()
        });

        return await this.handleApiResponse<T>(
          response,
          `get ${validatedType} ${id}`
        );
      }, `get ${validatedType} ${id}`);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

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
      // Validate entity type (now async)
      const validatedType = await this.validateEntityType(type);

      return await this.executeWithRetry(async () => {
        // Special case for TimeSheet entity which uses 'time' endpoint instead of 'TimeSheets'
        const endpoint = validatedType === 'TimeSheet' ? 'time' : `${validatedType}s`;
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data)
        });

        return await this.handleApiResponse<T>(
          response,
          `create ${validatedType}`
        );
      }, `create ${validatedType}`);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

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
      // Validate entity type (now async)
      const validatedType = await this.validateEntityType(type);

      return await this.executeWithRetry(async () => {
        // Special case for TimeSheet entity which uses 'time' endpoint instead of 'TimeSheets'
        const endpoint = validatedType === 'TimeSheet' ? 'time' : `${validatedType}s`;
        const response = await fetch(`${this.baseUrl}/${endpoint}/${id}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data)
        });

        return await this.handleApiResponse<T>(
          response,
          `update ${validatedType} ${id}`
        );
      }, `update ${validatedType} ${id}`);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

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

  /**
   * Fetch detailed metadata about entity types and their properties using hybrid approach
   * Primary: /EntityTypes for basic entity information (reliable, fast)
   * Secondary: /meta for relationship metadata and detailed properties (when needed)
   * Fallback: EntityRegistry for system types not in either endpoint
   */
  async fetchMetadata(): Promise<any> {
    try {
      return await this.executeWithRetry(async () => {
        // Step 1: Get basic entity types from /EntityTypes (fast, reliable)
        const entityTypesData = await this.fetchEntityTypes();
        
        // Step 2: Try to get relationship metadata from /meta (may fail due to JSON issues)
        let metaData = null;
        try {
          metaData = await this.fetchMetaEndpoint();
        } catch (error) {
          logger.warn('Failed to fetch /meta endpoint, using EntityTypes only:', error);
        }
        
        // Step 3: Combine and enhance the data
        return this.createHybridMetadata(entityTypesData, metaData);
      }, 'fetch metadata');
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to fetch metadata: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetch metadata from the original /meta endpoint with JSON parsing safeguards
   * Handles the malformed JSON issue by attempting to repair it
   */
  private async fetchMetaEndpoint(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/meta?format=json`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorMessage = await this.extractErrorMessage(response);
      throw new McpError(
        ErrorCode.InvalidRequest,
        `fetch /meta failed: ${response.status} - ${errorMessage}`
      );
    }

    const text = await response.text();
    
    // Try to parse JSON directly first
    try {
      return JSON.parse(text);
    } catch (_error) {
      // If parsing fails, try to repair the malformed JSON
      logger.warn('JSON parsing failed, attempting to repair malformed JSON');
      try {
        // Attempt to fix the duplicate key issue in the JSON
        const repairedJson = this.repairMetaJson(text);
        return JSON.parse(repairedJson);
      } catch (repairError) {
        logger.error('Failed to repair malformed JSON:', repairError);
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Failed to parse /meta response: malformed JSON'
        );
      }
    }
  }

  /**
   * Attempt to repair malformed JSON from /meta endpoint
   * Handles duplicate ResourceMetadataDescription keys
   */
  private repairMetaJson(jsonText: string): string {
    // This is a simple repair attempt - in practice, you might need more sophisticated logic
    // For now, we'll just return the original text and let it fail gracefully
    return jsonText;
  }

  /**
   * Create hybrid metadata combining EntityTypes and /meta endpoint data
   */
  private createHybridMetadata(entityTypesData: any, metaData: any): any {
    const result = {
      Items: [...entityTypesData.Items] // Start with EntityTypes data
    };

    // If we have meta data, enhance the items with relationship information
    if (metaData && metaData.Items) {
      const metaByName = new Map();
      
      // Index meta data by entity name
      for (const metaItem of metaData.Items) {
        if (metaItem.Name) {
          metaByName.set(metaItem.Name, metaItem);
        }
      }

      // Enhance EntityTypes items with meta information
      for (const item of result.Items) {
        const metaItem = metaByName.get(item.Name);
        if (metaItem) {
          // Add relationship and property information
          item.relationships = this.extractRelationships(metaItem);
          item.properties = this.extractProperties(metaItem);
          item.hierarchy = this.extractHierarchy(metaItem);
          item.canCreate = metaItem.CanCreate;
          item.canUpdate = metaItem.CanUpdate;
          item.canDelete = metaItem.CanDelete;
        }
      }

      // Add any entity types that exist in meta but not in EntityTypes
      for (const metaItem of metaData.Items) {
        if (metaItem.Name && !result.Items.some(item => item.Name === metaItem.Name)) {
          result.Items.push({
            Name: metaItem.Name,
            Description: metaItem.Description,
            Source: 'MetaEndpoint',
            relationships: this.extractRelationships(metaItem),
            properties: this.extractProperties(metaItem),
            hierarchy: this.extractHierarchy(metaItem),
            canCreate: metaItem.CanCreate,
            canUpdate: metaItem.CanUpdate,
            canDelete: metaItem.CanDelete
          });
        }
      }
    }

    // Finally, enhance with EntityRegistry system types
    return this.enhanceMetadataWithSystemTypes(result);
  }

  /**
   * Extract relationship information from meta item
   */
  private extractRelationships(metaItem: any): any {
    const relationships = {
      collections: [] as any[],
      values: [] as any[]
    };

    if (metaItem.ResourceMetadataPropertiesDescription) {
      // Extract collection relationships
      const collections = metaItem.ResourceMetadataPropertiesDescription.ResourceMetadataPropertiesResourceCollectionsDescription?.Items || [];
      for (const collection of collections) {
        relationships.collections.push({
          name: collection.Name,
          type: collection.Type,
          canAdd: collection.CanAdd,
          canRemove: collection.CanRemove,
          canGet: collection.CanGet,
          description: collection.Description
        });
      }

      // Extract value relationships
      const values = metaItem.ResourceMetadataPropertiesDescription.ResourceMetadataPropertiesResourceValuesDescription?.Items || [];
      for (const value of values) {
        relationships.values.push({
          name: value.Name,
          type: value.Type,
          canSet: value.CanSet,
          canGet: value.CanGet,
          isRequired: value.IsRequired,
          description: value.Description
        });
      }
    }

    return relationships;
  }

  /**
   * Extract property information from meta item
   */
  private extractProperties(metaItem: any): any {
    const properties: any = {};

    if (metaItem.ResourceMetadataPropertiesDescription) {
      // Combine both value and collection properties
      const allProperties = [
        ...(metaItem.ResourceMetadataPropertiesDescription.ResourceMetadataPropertiesResourceValuesDescription?.Items || []),
        ...(metaItem.ResourceMetadataPropertiesDescription.ResourceMetadataPropertiesResourceCollectionsDescription?.Items || [])
      ];

      for (const prop of allProperties) {
        properties[prop.Name] = {
          type: prop.Type,
          canSet: prop.CanSet,
          canGet: prop.CanGet,
          isRequired: prop.IsRequired,
          isDeprecated: prop.IsDeprecated,
          description: prop.Description,
          isTypeComplex: prop.IsTypeComplex,
          isSynthetic: prop.IsSynthetic,
          isCollection: prop.CanAdd !== undefined
        };
      }
    }

    return properties;
  }

  /**
   * Extract hierarchy information from meta item
   */
  private extractHierarchy(metaItem: any): any {
    const hierarchy = {
      baseTypes: [] as any[],
      derivedTypes: [] as any[]
    };

    if (metaItem.ResourceMetadataHierarchyDescription) {
      // Extract base types
      const baseItems = metaItem.ResourceMetadataHierarchyDescription.ResourceMetadataBaseResourceDescription?.Items || [];
      for (const baseItem of baseItems) {
        if (baseItem.Name) {
          hierarchy.baseTypes.push(baseItem.Name);
        }
      }

      // Extract derived types
      const derivedItems = metaItem.ResourceMetadataHierarchyDescription.ResourceMetadataDerivedResourceDescription?.Items || [];
      for (const derivedItem of derivedItems) {
        if (derivedItem.Name) {
          hierarchy.derivedTypes.push(derivedItem.Name);
        }
      }
    }

    return hierarchy;
  }

  /**
   * Enhance EntityTypes API data with system entity types from EntityRegistry
   * This ensures basic types like EntityState and GeneralUser are included
   */
  private enhanceMetadataWithSystemTypes(apiData: any): any {
    if (!apiData || !apiData.Items) {
      return apiData;
    }

    // Get system entity types from EntityRegistry
    const systemTypes = EntityRegistry.getEntityTypesByCategory(EntityCategory.SYSTEM);
    const existingNames = new Set(apiData.Items.map((item: any) => item.Name));
    
    // Add missing system types to the Items array
    for (const systemType of systemTypes) {
      if (!existingNames.has(systemType)) {
        const entityInfo = EntityRegistry.getEntityTypeInfo(systemType);
        if (entityInfo) {
          apiData.Items.push({
            Name: systemType,
            Description: entityInfo.description,
            IsAssignable: entityInfo.category === EntityCategory.ASSIGNABLE,
            IsGlobal: entityInfo.category === EntityCategory.SYSTEM,
            SupportsCustomFields: entityInfo.supportsCustomFields,
            Source: 'EntityRegistry' // Mark as coming from registry
          });
        }
      }
    }

    return apiData;
  }

  /**
   * Fetch entity types from /EntityTypes endpoint (faster, smaller response)
   * Implements pagination to get all entity types
   */
  async fetchEntityTypes(): Promise<any> {
    try {
      return await this.executeWithRetry(async () => {
        const allItems: any[] = [];
        let skip = 0;
        const take = 100; // Reasonable batch size
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(`${this.baseUrl}/EntityTypes?format=json&take=${take}&skip=${skip}`, {
            headers: this.getHeaders()
          });

          if (!response.ok) {
            const errorMessage = await this.extractErrorMessage(response);
            throw new McpError(
              ErrorCode.InvalidRequest,
              `fetch entity types failed: ${response.status} - ${errorMessage}`
            );
          }

          const text = await response.text();
          const batch = JSON.parse(text);
          
          if (batch.Items && batch.Items.length > 0) {
            allItems.push(...batch.Items);
            skip += take;
            hasMore = batch.Items.length === take; // Continue if we got a full batch
          } else {
            hasMore = false;
          }
        }

        return { Items: allItems };
      }, 'fetch entity types');
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to fetch entity types: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get a list of all valid entity types using the optimized /EntityTypes endpoint
   * This method combines API data with static registry for complete coverage
   */
  async getValidEntityTypes(): Promise<string[]> {
    try {
      logger.info('Fetching valid entity types from Target Process API...');
      logger.info(`Using domain: ${this.baseUrl}`);

      // Start with static entity types from registry
      const staticEntityTypes = EntityRegistry.getAllEntityTypes();
      const entityTypes = new Set<string>(staticEntityTypes);

      try {
        // Fetch from /EntityTypes endpoint (faster, smaller response)
        const entityTypesResponse = await this.fetchEntityTypes();
        
        if (entityTypesResponse && entityTypesResponse.Items) {
          logger.info(`EntityTypes response received with ${entityTypesResponse.Items.length} items`);
          
          // Add all entity types from the API
          for (const item of entityTypesResponse.Items) {
            if (item.Name && typeof item.Name === 'string') {
              entityTypes.add(item.Name);
              
              // Register custom entity types that aren't in the static registry
              if (!EntityRegistry.isValidEntityType(item.Name)) {
                logger.info(`Registering custom entity type: ${item.Name}`);
                EntityRegistry.registerCustomEntityType(item.Name);
              }
            }
          }
        } else {
          logger.warn('EntityTypes response missing Items array');
        }
      } catch (apiError) {
        logger.warn('Failed to fetch from /EntityTypes endpoint, using static list only:', apiError);
      }

      const finalEntityTypes = Array.from(entityTypes).sort();
      logger.info(`Total valid entity types: ${finalEntityTypes.length} (${finalEntityTypes.length - staticEntityTypes.length} from API)`);
      
      return finalEntityTypes;
    } catch (error) {
      logger.error('Error in getValidEntityTypes:', error);
      logger.warn('Falling back to static entity type list');
      return EntityRegistry.getAllEntityTypes();
    }
  }

  /**
   * Initialize the entity type cache on server startup
   * This helps avoid delays on the first API call
   */
  async initializeEntityTypeCache(): Promise<void> {
    try {
      if (!this.validEntityTypesCache) {
        logger.info('Pre-initializing entity type cache...');
        this.cacheInitPromise = this.getValidEntityTypes();
        this.validEntityTypesCache = await this.cacheInitPromise;
        this.cacheTimestamp = Date.now();
        this.cacheInitPromise = null;
        logger.info('Entity type cache initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize entity type cache:', error);
      // Don't throw - we'll retry on first use
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (this.authType === 'basic') {
      headers['Authorization'] = `Basic ${this.auth}`
    }

    return headers
  }

  private getQueryParams(defaults = {}) {
    const params = new URLSearchParams(defaults)
    if (this.authType === 'apikey') {
      params.append('access_token', this.auth)
    }
    return params
  }
}