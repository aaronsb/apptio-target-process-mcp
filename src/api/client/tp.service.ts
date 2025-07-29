import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AssignableEntityData } from '../../entities/assignable/assignable.entity.js';
import { UserStoryData } from '../../entities/assignable/user-story.entity.js';
import { ApiResponse, CreateEntityRequest, UpdateEntityRequest } from './api.types.js';
import { EntityRegistry, EntityCategory } from '../../core/entity-registry.js';
import { logger } from '../../utils/logger.js';
import { HttpClient, AuthConfig } from '../http/http-client.js';
import { QueryBuilder } from '../query/query-builder.js';
import { EntityValidator } from '../validation/entity-validator.js';
import { CommentService, CommentData } from '../comments/comment.service.js';

interface TPServiceCommonConfig {
  domain: string;
  retry?: {
    maxRetries: number;
    delayMs: number;
    backoffFactor: number;
  };
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
 * Orchestrates HttpClient, QueryBuilder, EntityValidator, and CommentService
 */
export class TPService {
  private readonly httpClient: HttpClient;
  private readonly queryBuilder: QueryBuilder;
  private readonly entityValidator: EntityValidator;
  private readonly commentService: CommentService;

  constructor(config: TPServiceConfig) {
    // Setup authentication configuration
    const authConfig: AuthConfig = isApiKeyConfig(config)
      ? {
          type: 'apikey',
          token: config.apiKey
        }
      : {
          type: 'basic',
          token: Buffer.from(`${config.credentials.username}:${config.credentials.password}`).toString('base64')
        };

    // Initialize HTTP client
    this.httpClient = new HttpClient({
      baseUrl: `https://${config.domain}/api/v1`,
      retry: config.retry
    }, authConfig);

    // Initialize query builder
    this.queryBuilder = new QueryBuilder(authConfig);

    // Initialize entity validator with callback to fetch entity types
    this.entityValidator = new EntityValidator(() => this.getValidEntityTypes());

    // Initialize comment service with dependencies
    this.commentService = new CommentService({
      executeWithRetry: this.httpClient.executeWithRetry.bind(this.httpClient),
      handleApiResponse: this.httpClient.handleApiResponse.bind(this.httpClient),
      getHeaders: () => this.getHeaders(),
      baseUrl: this.httpClient.getBaseUrl(),
      entityValidator: this.entityValidator
    });
  }

  /**
   * Search entities with filtering and includes
   */
  async searchEntities<T>(
    type: string,
    where?: string,
    include?: string[],
    take: number = 25,
    orderBy?: string[]
  ): Promise<T[]> {
    try {
      // Validate entity type
      const validatedType = await this.entityValidator.validateEntityTypeOrThrow(type);
      
      // Build query using QueryBuilder
      const queryString = this.queryBuilder
        .reset()
        .format('json')
        .take(take)
        .where(where || '')
        .include(include || [])
        .orderBy(orderBy || [])
        .buildQueryString();

      // Get the appropriate endpoint
      const endpoint = this.entityValidator.getEndpointForEntityType(validatedType);
      
      // Make the request
      const data = await this.httpClient.get<ApiResponse<T>>(`${endpoint}?${queryString}`);
      return data.Items || [];
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
   * Get a single entity by ID
   */
  async getEntity<T>(
    type: string,
    id: number,
    include?: string[]
  ): Promise<T> {
    try {
      // Validate entity type and ID
      const validatedType = await this.entityValidator.validateEntityTypeOrThrow(type);
      const idValidation = this.entityValidator.validateEntityId(id);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      // Build query using QueryBuilder
      const queryString = this.queryBuilder
        .reset()
        .format('json')
        .include(include || [])
        .buildQueryString();

      // Get the appropriate endpoint
      const endpoint = this.entityValidator.getEndpointForEntityType(validatedType);
      
      // Make the request
      return await this.httpClient.get<T>(`${endpoint}/${id}?${queryString}`);
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
      // Validate entity type
      const validatedType = await this.entityValidator.validateEntityTypeOrThrow(type);

      // Get the appropriate endpoint
      const endpoint = this.entityValidator.getEndpointForEntityType(validatedType);
      
      // Make the request
      return await this.httpClient.post<T>(endpoint, data);
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
      // Validate entity type and ID
      const validatedType = await this.entityValidator.validateEntityTypeOrThrow(type);
      const idValidation = this.entityValidator.validateEntityId(id);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      // Get the appropriate endpoint
      const endpoint = this.entityValidator.getEndpointForEntityType(validatedType);
      
      // Make the request (TargetProcess uses POST for updates)
      return await this.httpClient.post<T>(`${endpoint}/${id}`, data);
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
   * Get comments for an entity (delegates to CommentService)
   */
  async getComments(entityType: string, entityId: number): Promise<CommentData[]> {
    return this.commentService.getComments(entityType, entityId);
  }

  /**
   * Create a comment on an entity (delegates to CommentService)
   */
  async createComment(entityId: number, description: string, isPrivate?: boolean, parentCommentId?: number): Promise<CommentData> {
    return this.commentService.createComment({
      entityId,
      description,
      isPrivate,
      parentCommentId
    });
  }

  /**
   * Delete a comment by ID (delegates to CommentService)
   */
  async deleteComment(commentId: number): Promise<boolean> {
    return this.commentService.deleteComment(commentId);
  }

  /**
   * Helper method to get user stories with related data
   */
  async getUserStories(
    where?: string,
    include: string[] = ['Project', 'Team', 'Feature', 'Tasks', 'Bugs']
  ): Promise<(UserStoryData & AssignableEntityData)[]> {
    return this.searchEntities<UserStoryData & AssignableEntityData>(
      'UserStory',
      where,
      include
    );
  }

  /**
   * Helper method to get a single user story with related data
   */
  async getUserStory(
    id: number,
    include: string[] = ['Project', 'Team', 'Feature', 'Tasks', 'Bugs']
  ): Promise<UserStoryData & AssignableEntityData> {
    return this.getEntity<UserStoryData & AssignableEntityData>(
      'UserStory',
      id,
      include
    );
  }

  /**
   * Fetch detailed metadata about entity types and their properties
   */
  async fetchMetadata(): Promise<any> {
    try {
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
   * Fetch entity types from /EntityTypes endpoint (faster, smaller response)
   */
  async fetchEntityTypes(): Promise<any> {
    try {
      const allItems: any[] = [];
      let skip = 0;
      const take = 100;
      let hasMore = true;

      while (hasMore) {
        const queryString = this.queryBuilder
          .reset()
          .format('json')
          .take(take)
          .buildParams();
        queryString.append('skip', skip.toString());

        const batch = await this.httpClient.get<{ Items: any[] }>(`EntityTypes?${queryString}`);
        
        if (batch.Items && batch.Items.length > 0) {
          allItems.push(...batch.Items);
          skip += take;
          hasMore = batch.Items.length === take;
        } else {
          hasMore = false;
        }
      }

      return { Items: allItems };
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
   * Get valid entity types (delegates to EntityValidator)
   */
  async getValidEntityTypes(): Promise<string[]> {
    try {
      logger.info('Fetching valid entity types from Target Process API...');
      
      // Start with static entity types from registry
      const staticEntityTypes = EntityRegistry.getAllEntityTypes();
      const entityTypes = new Set<string>(staticEntityTypes);

      try {
        // Fetch from /EntityTypes endpoint
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
   */
  async initializeEntityTypeCache(): Promise<void> {
    await this.entityValidator.initializeEntityTypeCache();
  }

  /**
   * Get attachment metadata information
   */
  async getAttachmentInfo(attachmentId: number): Promise<any> {
    try {
      const idValidation = this.entityValidator.validateEntityId(attachmentId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      return await this.httpClient.get(`Attachments/${attachmentId}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get attachment info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Download attachment content as base64
   */
  async downloadAttachment(attachmentId: number): Promise<any> {
    try {
      const idValidation = this.entityValidator.validateEntityId(attachmentId);
      if (!idValidation.isValid) {
        throw new McpError(ErrorCode.InvalidRequest, idValidation.errors.join('; '));
      }

      // First get attachment metadata
      const attachmentInfo = await this.getAttachmentInfo(attachmentId);
      
      // Download the actual file content
      const arrayBuffer = await this.httpClient.downloadBinary(attachmentInfo.Uri);

      // Convert to base64
      const base64Content = Buffer.from(arrayBuffer).toString('base64');

      return {
        attachmentId,
        filename: attachmentInfo.Name,
        mimeType: attachmentInfo.MimeType,
        size: attachmentInfo.Size,
        base64Content,
        uploadDate: attachmentInfo.Date,
        owner: attachmentInfo.Owner ? {
          id: attachmentInfo.Owner.Id,
          name: `${attachmentInfo.Owner.FirstName || ''} ${attachmentInfo.Owner.LastName || ''}`.trim()
        } : null
      };
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to download attachment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get headers for authentication (for backward compatibility)
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (this.httpClient.getAuthType() === 'basic') {
      const authConfig = this.queryBuilder['authConfig'] as AuthConfig;
      headers['Authorization'] = `Basic ${authConfig.token}`;
    }

    return headers;
  }

  /**
   * Private methods for metadata processing (simplified versions)
   */
  private async fetchMetaEndpoint(): Promise<any> {
    try {
      return await this.httpClient.get('meta?format=json');
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Failed to parse /meta response: malformed JSON'
      );
    }
  }

  private createHybridMetadata(entityTypesData: any, metaData: any): any {
    const result = {
      Items: [...entityTypesData.Items]
    };

    // Enhance with EntityRegistry system types
    const systemTypes = EntityRegistry.getEntityTypesByCategory(EntityCategory.SYSTEM);
    const existingNames = new Set(result.Items.map((item: any) => item.Name));
    
    for (const systemType of systemTypes) {
      if (!existingNames.has(systemType)) {
        const entityInfo = EntityRegistry.getEntityTypeInfo(systemType);
        if (entityInfo) {
          result.Items.push({
            Name: systemType,
            Description: entityInfo.description,
            IsAssignable: entityInfo.category === EntityCategory.ASSIGNABLE,
            IsGlobal: entityInfo.category === EntityCategory.SYSTEM,
            SupportsCustomFields: entityInfo.supportsCustomFields,
            Source: 'EntityRegistry'
          });
        }
      }
    }

    return result;
  }
}