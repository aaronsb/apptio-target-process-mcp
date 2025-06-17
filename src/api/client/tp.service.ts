import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AssignableEntityData } from '../../entities/assignable/assignable.entity.js';
import { UserStoryData } from '../../entities/assignable/user-story.entity.js';
import { ApiResponse, CreateEntityRequest, UpdateEntityRequest } from './api.types.js';
import { EntityRegistry } from '../../core/entity-registry.js';
import { 
  AttachmentInfo, 
  AttachmentDownloadResponse, 
  AttachmentUploadResponse,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE 
} from '../../types/attachment.js';

declare const Buffer: {
  from(str: string): { toString(encoding: string): string };
};

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

export class TPService {
  private readonly baseUrl: string;
  private readonly auth: string;
  private authType: 'basic' | 'apikey' = 'basic';
  private readonly retryConfig: RetryConfig;

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
  }  constructor(config: TPServiceConfig) {
    if (isApiKeyConfig(config)) {
      this.auth = config.apiKey
      this.authType = 'apikey';
    } else {
      const credentials = `${config.credentials.username}:${config.credentials.password}`;
      this.auth = Buffer.from(credentials).toString('base64');
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
        return await operation();      } catch (error: unknown) {
        lastError = error as Error;

        // Handle unknown error types safely
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Don't retry on 400 (bad request) or 401 (unauthorized)
        if (error instanceof McpError &&
          (errorMessage.includes('status: 400') ||
            errorMessage.includes('status: 401'))) {
          throw error;
        }

        if (errorMessage.includes('status: 400') || errorMessage.includes('status: 401')) {
          throw new McpError(ErrorCode.InvalidRequest, errorMessage);
        }

        if (attempt === this.retryConfig.maxRetries) {
          break;
        }        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
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
      if (!this.validEntityTypesCache || isCacheExpired) {        // If initialization is already in progress, wait for it
        if (this.cacheInitPromise) {
          this.validEntityTypesCache = await this.cacheInitPromise;
        } else {
          // Start new initialization
          this.cacheInitPromise = this.getValidEntityTypes();
          try {
            this.validEntityTypesCache = await this.cacheInitPromise;
            this.cacheTimestamp = Date.now();
          } catch (error) {
            console.error('Failed to fetch valid entity types:', error);
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
   * Fetch metadata about entity types and their properties
   */
  async fetchMetadata(): Promise<any> {
    try {
      return await this.executeWithRetry(async () => {
        // Explicitly request JSON format in the URL
        const response = await fetch(`${this.baseUrl}/Index/meta?format=json`, {
          headers: this.getHeaders()
        });

        // Check if response is OK before trying to parse JSON
        if (!response.ok) {
          const errorMessage = await this.extractErrorMessage(response);
          throw new McpError(
            ErrorCode.InvalidRequest,
            `fetch metadata failed: ${response.status} - ${errorMessage}`
          );
        }

        // Get the text response and manually fix the JSON format if needed
        const text = await response.text();
        try {
          // Try to parse as-is first
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse JSON response, attempting to fix format...');

          // If parsing fails, try to fix the JSON by adding missing commas between objects
          const fixedText = text
            .replace(/}"/g, '},"')  // Add comma between objects
            .replace(/}}/g, '}}');  // Fix any double closing braces

          try {
            return JSON.parse(fixedText);
          } catch (fixError) {
            console.error('Failed to fix and parse JSON response:', fixError);
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Failed to parse metadata response: ${fixError instanceof Error ? fixError.message : String(fixError)}`
            );
          }
        }
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
   * Get a list of all valid entity types from the API
   * This can be used to dynamically validate entity types
   */
  async getValidEntityTypes(): Promise<string[]> {
    try {
      console.error('Fetching valid entity types from Target Process API...');
      console.error(`Using domain: ${this.baseUrl}`);

      const metadata = await this.fetchMetadata();
      const entityTypes: string[] = [];

      if (metadata && metadata.Items) {
        console.error(`Metadata response received with ${metadata.Items.length} items`);
        for (const item of metadata.Items) {
          if (item.Name && !entityTypes.includes(item.Name)) {
            entityTypes.push(item.Name);
          }
        }
      } else {
        console.error('Metadata response missing Items array:', JSON.stringify(metadata).substring(0, 200) + '...');
      }

      if (entityTypes.length === 0) {
        console.error('No entity types found in API response, falling back to static list');
        return EntityRegistry.getAllEntityTypes();
      }

      console.error(`Found ${entityTypes.length} valid entity types from API`);
      
      // Register any custom entity types discovered from the API
      for (const entityType of entityTypes) {
        if (!EntityRegistry.isValidEntityType(entityType)) {
          console.error(`Registering custom entity type: ${entityType}`);
          EntityRegistry.registerCustomEntityType(entityType);
        }
      }
      
      return entityTypes.sort();
    } catch (error) {
      console.error('Error fetching valid entity types:', error);
      // Provide more detailed error information
      if (error instanceof Error) {
        console.error(`Error details: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }

      if (error instanceof McpError) {
        throw error;
      }

      // Fall back to static list on error instead of throwing
      console.error('Falling back to static entity type list due to error');
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
        console.error('Pre-initializing entity type cache...');
        this.cacheInitPromise = this.getValidEntityTypes();
        this.validEntityTypesCache = await this.cacheInitPromise;
        this.cacheTimestamp = Date.now();
        this.cacheInitPromise = null;
        console.error('Entity type cache initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize entity type cache:', error);
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
    } else if (this.authType === 'apikey') {
      // For attachment downloads, we need the access token in Authorization header
      headers['Authorization'] = `Bearer ${this.auth}`
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
  /**
   * Get headers specifically for attachment downloads
   * Uses session-based approach for Basic Auth users
   */
  private getAttachmentHeaders() {
    const headers: Record<string, string> = {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    if (this.authType === 'basic') {
      headers['Authorization'] = `Basic ${this.auth}`
      // For Basic Auth, also try to maintain session cookies
      headers['Cookie'] = '' // Will be populated by successful API calls
    } else if (this.authType === 'apikey') {
      headers['Authorization'] = `Bearer ${this.auth}`
    }

    return headers
  }

  /**
   * Perform a login to establish session cookies for attachment downloads
   */
  private async establishSession(): Promise<string> {
    try {
      // Try to access a simple API endpoint to establish session
      const loginUrl = `${this.baseUrl.replace('/api/v1', '')}/login`;
      const response = await fetch(loginUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Extract cookies from response
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        // Parse and return cookies
        return setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');
      }
      
      return '';
    } catch (error) {
      console.warn('Could not establish session:', error);
      return '';
    }
  }/**
   * Download an attachment by its ID
   * Updated with research findings from Target Process GitHub samples
   */
  async downloadAttachment(attachmentId: number, format: 'url' | 'base64' = 'url'): Promise<AttachmentDownloadResponse> {
    try {
      // First get attachment info
      const attachmentInfo = await this.getAttachmentInfo(attachmentId);      if (format === 'base64') {
        // Try multiple download methods with Basic Auth enhancements
        const downloadMethods = [
          () => this.downloadViaAttachmentAspx(attachmentId, attachmentInfo),
          () => this.downloadViaApiFile(attachmentId, attachmentInfo),
          () => this.downloadViaUploadFile(attachmentId, attachmentInfo)
        ];        for (const method of downloadMethods) {
          try {
            const result = await method();
            if (result) {
              // Check if we got XML metadata instead of actual file
              const metadata = this.parseAttachmentMetadata(result);
              
              if (metadata.uniqueFileName) {
                console.log(`📋 Got metadata, attempting to download actual file: ${metadata.uniqueFileName}`);
                try {
                  const actualFile = await this.downloadActualFile(metadata.uniqueFileName);
                  
                  return {
                    attachmentId,
                    filename: metadata.actualName || attachmentInfo.Name,
                    mimeType: attachmentInfo.MimeType || this.detectMimeType(metadata.actualName || attachmentInfo.Name),
                    size: Math.round((actualFile.length * 3) / 4) || attachmentInfo.Size,
                    downloadUrl: this.generateDownloadUrl(attachmentId),
                    description: attachmentInfo.Description,
                    uploadDate: attachmentInfo.Date,
                    base64Content: actualFile,
                    owner: attachmentInfo.Owner ? {
                      id: attachmentInfo.Owner.Id,
                      name: `${attachmentInfo.Owner.FirstName || ''} ${attachmentInfo.Owner.LastName || ''}`.trim()
                    } : undefined
                  };
                } catch (fileError) {
                  console.warn(`Failed to download actual file, using metadata: ${fileError}`);
                  // Fall back to metadata if actual file download fails
                }
              }
              
              // Return original result if no metadata found or actual file download failed
              return {
                attachmentId,
                filename: attachmentInfo.Name,
                mimeType: attachmentInfo.MimeType || this.detectMimeType(attachmentInfo.Name),
                size: Math.round((result.length * 3) / 4) || attachmentInfo.Size,
                downloadUrl: this.generateDownloadUrl(attachmentId),
                description: attachmentInfo.Description,
                uploadDate: attachmentInfo.Date,
                base64Content: result,
                owner: attachmentInfo.Owner ? {
                  id: attachmentInfo.Owner.Id,
                  name: `${attachmentInfo.Owner.FirstName || ''} ${attachmentInfo.Owner.LastName || ''}`.trim()
                } : undefined
              };
            }
          } catch (methodError) {
            console.warn(`Download method failed, trying next: ${methodError}`);
            continue;
          }
        }
        
        // If all base64 methods fail, log the issue but continue with URL response
        console.warn(`All base64 download methods failed for attachment ${attachmentId}. This may require an Access Token - see Target Process documentation.`);
      }
      
      // For URL format or if base64 download failed, return URL-based download
      const downloadUrl = this.generateDownloadUrl(attachmentId);
      
      return {
        attachmentId,
        filename: attachmentInfo.Name,
        mimeType: attachmentInfo.MimeType || this.detectMimeType(attachmentInfo.Name),
        size: attachmentInfo.Size,
        downloadUrl,
        description: attachmentInfo.Description,
        uploadDate: attachmentInfo.Date,
        owner: attachmentInfo.Owner ? {
          id: attachmentInfo.Owner.Id,
          name: `${attachmentInfo.Owner.FirstName || ''} ${attachmentInfo.Owner.LastName || ''}`.trim()
        } : undefined
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to download attachment ${attachmentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Upload an attachment to an entity
   */
  async uploadAttachment(
    entityType: string,
    entityId: number,
    fileData: string, // base64 encoded
    filename: string,
    description?: string,
    mimeType?: string
  ): Promise<AttachmentUploadResponse> {
    try {
      // Validate entity type
      const validatedType = await this.validateEntityType(entityType);
      
      // Calculate file size from base64 (rough estimation)
      const estimatedSize = (fileData.length * 3) / 4;
      
      if (estimatedSize > MAX_FILE_SIZE) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `File size (~${Math.round(estimatedSize)} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`
        );
      }

      // Detect MIME type if not provided
      const detectedMimeType = mimeType || this.detectMimeType(filename);
      
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(detectedMimeType as any)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `File type '${detectedMimeType}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        );
      }

      return await this.executeWithRetry(async () => {
        // For now, return a simplified response since FormData/Blob might not be available
        // This would need to be implemented based on the specific Target Process upload API
        throw new McpError(
          ErrorCode.InvalidRequest,
          'File upload functionality is not yet fully implemented. Please use Target Process web interface for file uploads.'
        );      }, `upload attachment to ${validatedType} ${entityId}`);
    } catch (error: unknown) {
      if (error instanceof McpError) {
        return {
          success: false,
          message: error.message,
          error: error.message
        };
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to upload attachment: ${errorMessage}`,
        error: errorMessage
      };
    }
  }

  /**
   * Get attachment info by ID
   */
  async getAttachmentInfo(attachmentId: number): Promise<AttachmentInfo> {
    try {
      return await this.executeWithRetry(async () => {
        const params = this.getQueryParams({
          format: 'json'
        });

        const response = await fetch(`${this.baseUrl}/Attachments/${attachmentId}?${params}`, {
          headers: this.getHeaders()
        });

        return await this.handleApiResponse<AttachmentInfo>(
          response,
          `get attachment info ${attachmentId}`
        );
      }, `get attachment info ${attachmentId}`);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get attachment info ${attachmentId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Get attachments for a specific entity
   */
  async getAttachmentsForEntity(entityType: string, entityId: number): Promise<AttachmentInfo[]> {
    try {
      // Get entity with attachments included
      const entity = await this.getEntity(entityType, entityId, ['Attachments']);
      
      // Check if Attachments exists and is an array
      if (entity && (entity as any).Attachments) {
        const attachments = (entity as any).Attachments;
        
        // If it's an array, return it
        if (Array.isArray(attachments)) {
          return attachments;
        }
        
        // If it's an object with Items property (common TP API pattern)
        if (attachments.Items && Array.isArray(attachments.Items)) {
          return attachments.Items;
        }
        
        // If it's a single attachment, wrap in array
        if (typeof attachments === 'object' && attachments.Id) {
          return [attachments];
        }
      }
      
      return [];
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get attachments for ${entityType} ${entityId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detect MIME type from filename extension
   */
  private detectMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    
    const mimeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'html': 'text/html',
      'css': 'text/css',
      'json': 'application/json',
      'xml': 'application/xml'    };

    return mimeMap[ext || ''] || 'application/octet-stream';
  }
  /**
   * Generate download URL for attachment
   * Based on Target Process GitHub samples research
   */
  private generateDownloadUrl(attachmentId: number): string {
    // Primary method: Attachment.aspx endpoint with correct parameter name
    return `${this.baseUrl.replace('/api/v1', '')}/Attachment.aspx?AttachmentID=${attachmentId}`;
  }/**
   * Download via attachment.aspx endpoint (Method 1)
   * Enhanced for Basic Auth with session management
   */  private async downloadViaAttachmentAspx(attachmentId: number, attachmentInfo: any): Promise<string> {
    const baseUrl = this.baseUrl.replace('/api/v1', '');
    
    // For Basic Auth, try different URL patterns with correct parameter names
    const downloadUrls = [
      `${baseUrl}/Attachment.aspx?AttachmentID=${attachmentId}`,
      `${baseUrl}/attachment.aspx?AttachmentID=${attachmentId}`,
      `${baseUrl}/Attachment.aspx?ID=${attachmentId}`,
      `${baseUrl}/attachment.aspx?ID=${attachmentId}`,
      `${baseUrl}/AttachmentDownload.aspx?AttachmentID=${attachmentId}`,
      `${baseUrl}/api/v1/Attachments/${attachmentId}/File`
    ];

    // Try to establish session first
    const sessionCookies = this.authType === 'basic' ? await this.establishSession() : '';
    
    for (const downloadUrl of downloadUrls) {
      try {
        console.log(`🔍 Attempting download via: ${downloadUrl}`);
        
        const headers = this.getAttachmentHeaders();
        if (sessionCookies) {
          headers['Cookie'] = sessionCookies;
        }
        
        const response = await fetch(downloadUrl, { headers });

        console.log(`📊 Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          
          // Check if we got HTML (login page) instead of binary data
          if (contentType.includes('text/html')) {
            const text = await response.text();
            console.log(`⚠️ Got HTML response (first 200 chars): ${text.substring(0, 200)}...`);
            
            if (text.includes('Targetprocess Login') || text.includes('login-page')) {
              console.log(`❌ Login redirect detected for ${downloadUrl}`);
              continue; // Try next URL
            }
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          if (uint8Array.length > 0) {
            console.log(`✅ Successfully downloaded ${uint8Array.length} bytes via ${downloadUrl}`);
            return btoa(String.fromCharCode(...uint8Array));
          }
        }
        
        console.log(`❌ Failed with ${downloadUrl}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`❌ Error with ${downloadUrl}:`, error);
        continue;
      }
    }
    
    throw new Error('All download URLs failed - attachment may require different authentication');
  }  /**
   * Download via API File endpoint (Method 2)
   * Enhanced with multiple fallback strategies
   */
  private async downloadViaApiFile(attachmentId: number, attachmentInfo: any): Promise<string> {
    const endpoints = [
      `${this.baseUrl}/Attachments/${attachmentId}/File`,
      `${this.baseUrl}/Attachments/${attachmentId}`,
      `${this.baseUrl}/Attachments/${attachmentId}/Download`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: this.getAttachmentHeaders()
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('text/html')) {
            const text = await response.text();
            if (text.includes('Targetprocess Login') || text.includes('login-page')) {
              continue; // Try next endpoint
            }
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          if (uint8Array.length > 0) {
            return btoa(String.fromCharCode(...uint8Array));
          }
        }
      } catch (error) {
        console.log(`Failed ${endpoint}:`, error);
        continue;
      }
    }
    
    throw new Error('All API File endpoints failed');
  }  /**
   * Parse XML metadata to extract UniqueFileName for actual file download
   */
  private parseAttachmentMetadata(base64Data: string): { uniqueFileName?: string; actualName?: string } {
    try {
      // Decode base64 using atob (browser compatible)
      const xmlString = atob(base64Data);
      
      // Extract UniqueFileName from XML
      const uniqueFileNameMatch = xmlString.match(/<UniqueFileName>([^<]+)<\/UniqueFileName>/);
      const nameMatch = xmlString.match(/<Attachment[^>]*Name="([^"]+)"/);
      
      return {
        uniqueFileName: uniqueFileNameMatch ? uniqueFileNameMatch[1] : undefined,
        actualName: nameMatch ? nameMatch[1] : undefined
      };
    } catch (error) {
      console.log('Failed to parse metadata:', error);
      return {};
    }
  }
  /**
   * Download actual file content using UniqueFileName
   */
  private async downloadActualFile(uniqueFileName: string): Promise<string> {
    const baseUrl = this.baseUrl.replace('/api/v1', '');
    
    // Try different download URL patterns for maximum compatibility
    const downloadUrls = [
      `${baseUrl}/UploadFile.ashx?file=${encodeURIComponent(uniqueFileName)}`,
      `${baseUrl}/uploadfile.ashx?file=${encodeURIComponent(uniqueFileName)}`,
    ];
    
    // Add Access Token parameter if using API key auth
    if (this.authType === 'apikey') {
      downloadUrls.forEach((url, index) => {
        downloadUrls[index] = `${url}&access_token=${encodeURIComponent(this.auth)}`;
      });
    }
    
    for (const downloadUrl of downloadUrls) {
      try {
        console.log(`🔍 Downloading actual file: ${downloadUrl.replace(this.auth, 'XXX')}`);
        
        const response = await fetch(downloadUrl, {
          headers: this.getAttachmentHeaders()
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          
          // Check if we got HTML (login page) instead of binary data
          if (contentType.includes('text/html')) {
            console.log(`⚠️ Got HTML response instead of binary data from ${downloadUrl}`);
            continue; // Try next URL
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Validate that we got actual file content (should be larger than metadata)
          if (uint8Array.length > 100) {
            console.log(`✅ Downloaded actual file: ${uint8Array.length} bytes`);
            return btoa(String.fromCharCode(...uint8Array));
          } else {
            console.log(`⚠️ Downloaded content too small (${uint8Array.length} bytes), might be metadata`);
          }
        } else {
          console.log(`❌ Failed with ${downloadUrl}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error with ${downloadUrl}: ${error}`);
      }
    }
    
    throw new Error(`Failed to download actual file for UniqueFileName: ${uniqueFileName}`);
  }/**
   * Download via UploadFile.ashx endpoint (Method 3)
   * Using UniqueFileName from attachment info
   */
  private async downloadViaUploadFile(attachmentId: number, attachmentInfo: any): Promise<string> {
    if (!attachmentInfo.UniqueFileName) {
      throw new Error('UniqueFileName not available for UploadFile.ashx method');
    }

    const baseUrl = this.baseUrl.replace('/api/v1', '');
    const fileName = encodeURIComponent(attachmentInfo.UniqueFileName);
    const queryParams = this.authType === 'apikey' ? `?file=${fileName}&access_token=${encodeURIComponent(this.auth)}` : `?file=${fileName}`;
    const downloadUrl = `${baseUrl}/UploadFile.ashx${queryParams}`;
    
    const response = await fetch(downloadUrl, {
      headers: this.getAttachmentHeaders()
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // Check if we got HTML (login page) instead of binary data
      if (contentType.includes('text/html')) {
        const text = await response.text();
        if (text.includes('Targetprocess Login') || text.includes('login-page')) {
          throw new Error('Access denied - redirected to login page. UploadFile.ashx requires Access Token authentication.');
        }
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      return btoa(String.fromCharCode(...uint8Array));
    }
    
    throw new Error(`UploadFile.ashx failed: ${response.status} ${response.statusText}`);
  }
}