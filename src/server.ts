import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { logger, createLogger } from './utils/logger.js';
import fs from 'fs';
import path from 'path';

import { TPService, TPServiceConfig } from './api/client/tp.service.js';
import { TPContextBuilder, TPContextInfo } from './context/context-builder.js';
import { ResourceProvider } from './resources/resource-provider.js';
import { EntityRegistry } from './core/entity-registry.js';
import { SearchTool } from './tools/search/search.tool.js';
import { GetEntityTool } from './tools/entity/get.tool.js';
import { CreateEntityTool } from './tools/entity/create.tool.js';
import { UpdateEntityTool } from './tools/update/update.tool.js';
import { InspectObjectTool } from './tools/inspect/inspect.tool.js';
import { operationRegistry } from './core/operation-registry.js';
import { personalityLoader } from './core/personality-loader.js';
import { WorkOperations } from './operations/work/index.js';
import { GeneralOperations } from './operations/general/index.js';
import { paginateText } from './utils/paginator.js';
import { ShowMoreTool } from './tools/pagination/show-more.tool.js';
import { ShowAllTool } from './tools/pagination/show-all.tool.js';

function loadConfig(): TPServiceConfig {
  // Try API key authentication
  if (process.env.TP_API_KEY && process.env.TP_DOMAIN) {
    logger.info('Using API key authentication from environment variables');
    return {
      domain: process.env.TP_DOMAIN,
      apiKey: process.env.TP_API_KEY
    }
  }

  // Try basic authentication with environment variables
  if (process.env.TP_DOMAIN && process.env.TP_USERNAME && process.env.TP_PASSWORD) {
    logger.info('Using basic authentication from environment variables');
    return {
      domain: process.env.TP_DOMAIN,
      credentials: {
        username: process.env.TP_USERNAME,
        password: process.env.TP_PASSWORD
      }
    };
  }

  // Fall back to config file - check multiple locations
  const configLocations = [
    // Current directory
    path.join(process.cwd(), 'targetprocess.json'),
    // Config subdirectory
    path.join(process.cwd(), 'config', 'targetprocess.json'),
    // User's home directory
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.targetprocess.json'),
    // User's config directory
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'targetprocess', 'config.json')
  ];

  let configPath = null;
  for (const location of configLocations) {
    if (fs.existsSync(location)) {
      configPath = location;
      logger.info(`Found configuration file at ${location}`);
      break;
    }
  }

  if (!configPath) {
    const errorMessage = 'No configuration found. Please set environment variables (TP_DOMAIN, TP_USERNAME, TP_PASSWORD) or create a configuration file in one of these locations:\n' +
      configLocations.join('\n');
    logger.error(errorMessage);
    throw new McpError(ErrorCode.InternalError, errorMessage);
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    logger.error(`Error parsing config file ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    throw new McpError(
      ErrorCode.InternalError,
      `Error parsing config file ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export class TargetProcessServer {
  private server: Server;
  private service: TPService;
  private contextBuilder: TPContextBuilder;
  private context: TPContextInfo | null = null;
  private resourceProvider: ResourceProvider;
  private tools: {
    search: SearchTool;
    get: GetEntityTool;
    create: CreateEntityTool;
    update: UpdateEntityTool;
    inspect: InspectObjectTool;
    [key: string]: any; // Allow dynamic semantic tools
  };
  private userRole: string;

  constructor() {
    // Load user role from environment, default to 'default' for basic semantic operations
    this.userRole = process.env.TP_USER_ROLE || 'default';
    logger.info(`User role configured as: ${this.userRole}`);

    // Initialize service
    const config = loadConfig();
    this.service = new TPService(config);
    this.contextBuilder = new TPContextBuilder(this.service);
    this.resourceProvider = new ResourceProvider(this.service, this.context);

    // Initialize semantic features
    this.initializeSemanticFeatures();

    // Initialize core tools
    this.tools = {
      search: new SearchTool(this.service),
      get: new GetEntityTool(this.service),
      create: new CreateEntityTool(this.service),
      update: new UpdateEntityTool(this.service),
      inspect: new InspectObjectTool(this.service),
      show_more: new ShowMoreTool(),
      show_all: new ShowAllTool()
    };

    // Initialize role-based semantic tools
    this.initializeSemanticTools();

    // Initialize server
    this.server = new Server(
      {
        name: 'target-process-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: this.getToolCapabilities(),
          resources: {},
        },
      }
    );

    this.setupHandlers();

    // Error handling
    this.server.onerror = (error) => logger.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    // Initialize caches and context in the background
    this.initializeCache();
  }

  /**
   * Initialize caches and context in the background to improve first-request performance
   */
  private async initializeCache(): Promise<void> {
    try {
      // Initialize entity type cache
      await this.service.initializeEntityTypeCache();
      
      // Build TargetProcess context
      logger.info('Building TargetProcess context...');
      this.context = await this.contextBuilder.buildContext();
      
      // Update resource provider with context
      this.resourceProvider = new ResourceProvider(this.service, this.context);
      logger.info('TargetProcess context built successfully');
    } catch (error) {
      logger.error('Cache/context initialization error:', error);
      // Non-fatal error, server can still function
    }
  }

  /**
   * Initialize semantic features and register them with the operation registry
   */
  private initializeSemanticFeatures(): void {
    try {
      // Register general operations module (available to all users)
      const generalOperations = new GeneralOperations(this.service);
      operationRegistry.registerFeature(generalOperations);
      
      // Register work operations module
      const workOperations = new WorkOperations(this.service);
      operationRegistry.registerFeature(workOperations);
      
      // Future modules can be registered here
      // const collaborationOperations = new CollaborationOperations(this.service);
      // operationRegistry.registerFeature(collaborationOperations);
      
      logger.info('Semantic features initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize semantic features:', error);
    }
  }

  /**
   * Initialize role-based semantic tools
   */
  private initializeSemanticTools(): void {
    try {
      // Get operations for the current user role
      const availableOperations = operationRegistry.getOperationsForPersonality(this.userRole);
      
      logger.info(`Initializing ${availableOperations.length} semantic tools for role: ${this.userRole}`);
      
      // Create individual MCP tools for each semantic operation
      availableOperations.forEach(operation => {
        const toolName = operation.metadata.id.replace(/-/g, '_'); // Convert to snake_case for MCP
        this.tools[toolName] = this.createSemanticTool(operation);
        logger.info(`Registered semantic tool: ${toolName}`);
      });
      
    } catch (error) {
      logger.error('Failed to initialize semantic tools:', error);
    }
  }

  /**
   * Create a focused MCP tool for a specific semantic operation
   */
  private createSemanticTool(operation: any) {
    return {
      name: operation.metadata.id.replace(/-/g, '_'),
      description: operation.metadata.description,
      inputSchema: this.createSemanticToolSchema(operation),
      handler: async (args: any) => {
        try {
          // Build execution context using configured identity
          const userId = parseInt(process.env.TP_USER_ID || '0');
          const userEmail = process.env.TP_USER_EMAIL || '';
          
          if (!userId) {
            return {
              content: [{
                type: 'text',
                text: 'Error: No user identity configured. Please set TP_USER_ID in your environment.'
              }]
            };
          }
          
          // TODO: Fetch actual user name from API based on ID
          const userName = userEmail.split('@')[0] || 'User';
          
          const context = personalityLoader.buildExecutionContext(
            this.userRole,
            { id: userId, name: userName, email: userEmail },
            {},
            {}
          );

          // Execute the operation
          const result = await operation.execute(context, args);
          
          // Debug logging
          logger.debug('Semantic operation result:', JSON.stringify(result, null, 2));
          
          // Format result for MCP
          const formattedText = this.formatSemanticResult(result);
          logger.debug('Formatted text:', formattedText);
          
          return {
            content: [{
              type: 'text',
              text: formattedText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text', 
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      }
    };
  }

  /**
   * Create JSON Schema for a semantic operation
   */
  private createSemanticToolSchema(operation: any) {
    if (operation.getSchema) {
      const zodSchema = operation.getSchema();
      
      // Basic Zod to JSON Schema conversion
      // This is simplified - a full implementation would use zodToJsonSchema library
      const shape = (zodSchema as any)._def?.shape?.() || {};
      const properties: any = {};
      const required: string[] = [];
      
      Object.entries(shape).forEach(([key, value]: [string, any]) => {
        const def = value._def;
        
        // Determine type
        let type = 'string';
        if (def?.typeName === 'ZodNumber') type = 'number';
        else if (def?.typeName === 'ZodBoolean') type = 'boolean';
        else if (def?.typeName === 'ZodEnum') {
          properties[key] = {
            type: 'string',
            enum: def.values,
            description: def.description
          };
          return;
        }
        
        properties[key] = {
          type,
          description: def?.description
        };
        
        // Check if required (not optional)
        if (def?.typeName !== 'ZodOptional' && def?.typeName !== 'ZodDefault') {
          required.push(key);
        }
      });
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false
      };
    }
    
    return {
      type: 'object',
      properties: {},
      additionalProperties: true
    };
  }

  /**
   * Get tool capabilities dynamically based on available tools
   */
  private getToolCapabilities() {
    const capabilities: Record<string, boolean> = {
      search_entities: true,
      get_entity: true,
      create_entity: true,
      update_entity: true,
      inspect_object: true
    };

    // Add semantic tool capabilities
    Object.keys(this.tools).forEach(toolName => {
      if (!['search', 'get', 'create', 'update', 'inspect'].includes(toolName)) {
        capabilities[toolName] = true;
      }
    });

    return capabilities;
  }

  /**
   * Format semantic operation result for display with automatic pagination
   */
  private formatSemanticResult(result: any): string {
    const parts: string[] = [];

    // Main content
    if (result.content) {
      result.content.forEach((content: any) => {
        if (content.type === 'text' && content.text) {
          parts.push(content.text);
        } else if (content.type === 'structured-data' && content.data) {
          parts.push(JSON.stringify(content.data, null, 2));
        } else if (content.type === 'error' && content.text) {
          parts.push(`Error: ${content.text}`);
        }
      });
    }

    // Suggestions
    if (result.suggestions && result.suggestions.length > 0) {
      parts.push('\n💡 **Suggested Next Actions:**');
      result.suggestions.forEach((suggestion: string) => {
        parts.push(`  • ${suggestion}`);
      });
    }

    const fullText = parts.join('\n');
    
    // Apply automatic pagination to large responses
    const paginationResult = paginateText(fullText);
    return paginationResult.text;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Get enhanced tool definitions with TP context
      const contextDescription = this.context 
        ? this.contextBuilder.generateContextDescription(this.context)
        : '';

      const tools = [
        this.getEnhancedSearchDefinition(contextDescription),
        this.getEnhancedGetDefinition(contextDescription),
        this.getEnhancedCreateDefinition(contextDescription),
        this.getEnhancedUpdateDefinition(contextDescription),
        this.getEnhancedInspectDefinition(contextDescription),
        this.getShowMoreDefinition(),
        this.getShowAllDefinition(),
      ];

      // Add semantic tools for the current role
      Object.keys(this.tools).forEach(toolName => {
        if (!['search', 'get', 'create', 'update', 'inspect', 'show_more', 'show_all'].includes(toolName)) {
          const tool = (this.tools as any)[toolName];
          if (tool && tool.description) {
            tools.push({
              name: toolName as any,
              description: tool.description,
              inputSchema: tool.inputSchema
            });
          }
        }
      });

      return { tools };
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.resourceProvider.getAvailableResources(),
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const content = await this.resourceProvider.getResourceContent(request.params.uri);
        return {
          contents: [
            {
              uri: content.uri,
              mimeType: content.mimeType,
              text: content.text,
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Failed to read resource: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const toolName = request.params.name;
        
        // Handle core tools
        switch (toolName) {
          case 'search_entities':
            return await this.tools.search.execute(request.params.arguments);
          case 'get_entity':
            return await this.tools.get.execute(request.params.arguments);
          case 'create_entity':
            return await this.tools.create.execute(request.params.arguments);
          case 'update_entity':
            return await this.tools.update.execute(request.params.arguments);
          case 'inspect_object':
            return await this.tools.inspect.execute(request.params.arguments);
        }

        // Handle pagination tools
        if (toolName === 'show_more') {
          return await this.tools.show_more.execute(request.params.arguments);
        }
        if (toolName === 'show_all') {
          return await this.tools.show_all.execute(request.params.arguments);
        }

        // Handle semantic tools
        if (this.tools[toolName] && this.tools[toolName].handler) {
          return await this.tools[toolName].handler(request.params.arguments);
        }

        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        return {
          content: [
            {
              type: 'text',
              text: `Target Process API error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getEnhancedSearchDefinition(contextDescription: string) {
    const baseDefinition = SearchTool.getDefinition();
    if (contextDescription && this.context) {
      // Use discovered entity types if available
      const entityTypes = this.context.entityTypes.length > 0 
        ? this.context.entityTypes 
        : EntityRegistry.getAllEntityTypes();

      // Add available entity types to the description
      const entityTypesList = entityTypes.slice(0, 15).join(', ') + (entityTypes.length > 15 ? ', ...' : '');
      
      return {
        ...baseDefinition,
        description: `${baseDefinition.description}\n\n${contextDescription}`,
        inputSchema: {
          ...baseDefinition.inputSchema,
          properties: {
            ...baseDefinition.inputSchema.properties,
            type: {
              ...baseDefinition.inputSchema.properties.type,
              description: `Type of entity to search. Available types: ${entityTypesList}`,
            },
          },
        },
      };
    }
    return baseDefinition;
  }

  private getEnhancedGetDefinition(contextDescription: string) {
    const baseDefinition = GetEntityTool.getDefinition();
    if (contextDescription && this.context) {
      // Use discovered entity types if available
      const entityTypes = this.context.entityTypes.length > 0 
        ? this.context.entityTypes 
        : EntityRegistry.getAllEntityTypes();

      // Add available entity types to the description
      const entityTypesList = entityTypes.slice(0, 15).join(', ') + (entityTypes.length > 15 ? ', ...' : '');
      
      return {
        ...baseDefinition,
        description: `${baseDefinition.description}\n\n${contextDescription}`,
        inputSchema: {
          ...baseDefinition.inputSchema,
          properties: {
            ...baseDefinition.inputSchema.properties,
            type: {
              ...baseDefinition.inputSchema.properties.type,
              description: `Type of entity to retrieve. Available types: ${entityTypesList}`,
            },
          },
        },
      };
    }
    return baseDefinition;
  }

  private getEnhancedCreateDefinition(contextDescription: string) {
    const baseDefinition = CreateEntityTool.getDefinition();
    if (contextDescription && this.context) {
      // Use discovered entity types if available
      const entityTypes = this.context.entityTypes.length > 0 
        ? this.context.entityTypes 
        : EntityRegistry.getAllEntityTypes();

      // Add available entity types to the description
      const entityTypesList = entityTypes.slice(0, 15).join(', ') + (entityTypes.length > 15 ? ', ...' : '');
      
      return {
        ...baseDefinition,
        description: `${baseDefinition.description}\n\n${contextDescription}`,
        inputSchema: {
          ...baseDefinition.inputSchema,
          properties: {
            ...baseDefinition.inputSchema.properties,
            type: {
              ...baseDefinition.inputSchema.properties.type,
              description: `Type of entity to create. Available types: ${entityTypesList}`,
            },
          },
        },
      };
    }
    return baseDefinition;
  }

  private getEnhancedUpdateDefinition(contextDescription: string) {
    const baseDefinition = UpdateEntityTool.getDefinition();
    if (contextDescription && this.context) {
      // Use discovered entity types if available
      const entityTypes = this.context.entityTypes.length > 0 
        ? this.context.entityTypes 
        : EntityRegistry.getAllEntityTypes();

      // Add available entity types to the description
      const entityTypesList = entityTypes.slice(0, 15).join(', ') + (entityTypes.length > 15 ? ', ...' : '');
      
      return {
        ...baseDefinition,
        description: `${baseDefinition.description}\n\n${contextDescription}`,
        inputSchema: {
          ...baseDefinition.inputSchema,
          properties: {
            ...baseDefinition.inputSchema.properties,
            type: {
              ...baseDefinition.inputSchema.properties.type,
              description: `Type of entity to update. Available types: ${entityTypesList}`,
            },
          },
        },
      };
    }
    return baseDefinition;
  }

  private getEnhancedInspectDefinition(contextDescription: string) {
    const baseDefinition = InspectObjectTool.getDefinition();
    if (contextDescription && this.context) {
      // Use discovered entity types if available
      const entityTypes = this.context.entityTypes.length > 0 
        ? this.context.entityTypes 
        : EntityRegistry.getAllEntityTypes();

      // Add available entity types to the description
      const entityTypesList = entityTypes.slice(0, 15).join(', ') + (entityTypes.length > 15 ? ', ...' : '');
      
      return {
        ...baseDefinition,
        description: `${baseDefinition.description}\n\n${contextDescription}`,
        inputSchema: {
          ...baseDefinition.inputSchema,
          properties: {
            ...baseDefinition.inputSchema.properties,
            entityType: {
              ...baseDefinition.inputSchema.properties.entityType,
              description: `Type of entity to inspect. Available types: ${entityTypesList}`,
            },
          },
        },
      };
    }
    return baseDefinition;
  }

  private getShowMoreDefinition() {
    return {
      name: 'show_more',
      description: 'Show more results from a paginated response',
      inputSchema: {
        type: 'object',
        properties: {
          cacheKey: {
            type: 'string',
            description: 'Cache key from previous paginated result'
          },
          page: {
            type: 'number',
            minimum: 2,
            description: 'Specific page number to show (default: next page)'
          }
        },
        required: ['cacheKey']
      }
    };
  }

  private getShowAllDefinition() {
    return {
      name: 'show_all',
      description: 'Show all results without pagination',
      inputSchema: {
        type: 'object',
        properties: {
          cacheKey: {
            type: 'string',
            description: 'Cache key from previous paginated result'
          }
        },
        required: ['cacheKey']
      }
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    const timestamp = new Date().toISOString();
    logger.info(`Target Process MCP server running on stdio (started at ${timestamp})`);
  }
}
