import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { EntityRegistry, EntityCategory } from '../../core/entity-registry.js';
import { logger } from '../../utils/logger.js';

export interface ValidationResult {
  isValid: boolean;
  validatedType: string;
  errors: string[];
}

export interface EntityTypeCache {
  types: string[];
  timestamp: number;
  expiryMs: number;
}

/**
 * Service for validating entity types and transforming entity data
 * Provides cached validation with fallback to static registry
 */
export class EntityValidator {
  private validEntityTypesCache: string[] | null = null;
  private cacheInitPromise: Promise<string[]> | null = null;
  private readonly cacheExpiryMs = 3600000; // Cache expires after 1 hour
  private cacheTimestamp: number = 0;
  private fetchEntityTypesCallback: (() => Promise<string[]>) | null = null;

  /**
   * Constructor accepts a callback to fetch entity types from external source
   */
  constructor(fetchEntityTypesCallback?: () => Promise<string[]>) {
    this.fetchEntityTypesCallback = fetchEntityTypesCallback || null;
  }

  /**
   * Validates that the entity type is supported by Target Process
   * Uses dynamic validation with caching for better accuracy
   */
  async validateEntityType(type: string): Promise<ValidationResult> {
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
        return {
          isValid: false,
          validatedType: type,
          errors: [`Invalid entity type: '${type}'. Valid entity types are: ${this.validEntityTypesCache.join(', ')}`]
        };
      }

      return {
        isValid: true,
        validatedType: type,
        errors: []
      };
    } catch (error) {
      // If error is already a McpError, extract the message
      if (error instanceof McpError) {
        return {
          isValid: false,
          validatedType: type,
          errors: [error.message]
        };
      }

      // Fall back to static validation if dynamic validation fails
      if (!staticValidEntityTypes.includes(type)) {
        return {
          isValid: false,
          validatedType: type,
          errors: [`Invalid entity type: '${type}'. Valid entity types are: ${staticValidEntityTypes.join(', ')}`]
        };
      }

      return {
        isValid: true,
        validatedType: type,
        errors: []
      };
    }
  }

  /**
   * Validates entity type and throws if invalid
   */
  async validateEntityTypeOrThrow(type: string): Promise<string> {
    const result = await this.validateEntityType(type);
    if (!result.isValid) {
      throw new McpError(ErrorCode.InvalidRequest, result.errors.join('; '));
    }
    return result.validatedType;
  }

  /**
   * Get the appropriate API endpoint for an entity type
   * Handles special cases like TimeSheet -> time
   */
  getEndpointForEntityType(entityType: string): string {
    // Special case for TimeSheet entity which uses 'time' endpoint instead of 'TimeSheets'
    if (entityType === 'TimeSheet') {
      return 'time';
    }
    return `${entityType}s`;
  }

  /**
   * Validate entity ID
   */
  validateEntityId(id: unknown): ValidationResult {
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      return {
        isValid: false,
        validatedType: '',
        errors: ['Entity ID must be a positive integer']
      };
    }

    return {
      isValid: true,
      validatedType: '',
      errors: []
    };
  }

  /**
   * Get valid entity types using the configured callback or static registry
   */
  private async getValidEntityTypes(): Promise<string[]> {
    try {
      if (this.fetchEntityTypesCallback) {
        logger.info('Fetching valid entity types from external source...');
        return await this.fetchEntityTypesCallback();
      }
    } catch (error) {
      logger.warn('Failed to fetch entity types from external source, using static registry:', error);
    }

    // Fallback to static entity types from registry
    return EntityRegistry.getAllEntityTypes();
  }

  /**
   * Initialize the entity type cache on startup
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

  /**
   * Get cached entity types or fetch if needed
   */
  async getCachedEntityTypes(): Promise<string[]> {
    const isCacheExpired = Date.now() - this.cacheTimestamp > this.cacheExpiryMs;
    
    if (!this.validEntityTypesCache || isCacheExpired) {
      await this.initializeEntityTypeCache();
    }
    
    return this.validEntityTypesCache || EntityRegistry.getAllEntityTypes();
  }

  /**
   * Clear the entity type cache (useful for testing)
   */
  clearCache(): void {
    this.validEntityTypesCache = null;
    this.cacheTimestamp = 0;
    this.cacheInitPromise = null;
  }

  /**
   * Check if an entity type is assignable (can be assigned to users)
   */
  isAssignableEntityType(entityType: string): boolean {
    const entityInfo = EntityRegistry.getEntityTypeInfo(entityType);
    return entityInfo?.category === EntityCategory.ASSIGNABLE || false;
  }

  /**
   * Check if an entity type supports custom fields
   */
  supportsCustomFields(entityType: string): boolean {
    const entityInfo = EntityRegistry.getEntityTypeInfo(entityType);
    return entityInfo?.supportsCustomFields || false;
  }

  /**
   * Get entity type information from registry
   */
  getEntityTypeInfo(entityType: string) {
    return EntityRegistry.getEntityTypeInfo(entityType);
  }
}