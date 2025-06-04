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

function loadConfig(): TPServiceConfig {
  // Try API key authentication
  if (process.env.TP_API_KEY && process.env.TP_DOMAIN) {
    console.error('Using API key authentication from environment variables');
    return {
      domain: process.env.TP_DOMAIN,
      apiKey: process.env.TP_API_KEY
    }
  }

  // Try basic authentication with environment variables
  if (process.env.TP_DOMAIN && process.env.TP_USERNAME && process.env.TP_PASSWORD) {
    console.error('Using basic authentication from environment variables');
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
      console.error(`Found configuration file at ${location}`);
      break;
    }
  }

  if (!configPath) {
    const errorMessage = 'No configuration found. Please set environment variables (TP_DOMAIN, TP_USERNAME, TP_PASSWORD) or create a configuration file in one of these locations:\n' +
      configLocations.join('\n');
    console.error(errorMessage);
    throw new McpError(ErrorCode.InternalError, errorMessage);
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error(`Error parsing config file ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
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
  };

  constructor() {
    // Initialize service
    const config = loadConfig();
    this.service = new TPService(config);
    this.contextBuilder = new TPContextBuilder(this.service);
    this.resourceProvider = new ResourceProvider(this.service, this.context);

    // Initialize tools
    this.tools = {
      search: new SearchTool(this.service),
      get: new GetEntityTool(this.service),
      create: new CreateEntityTool(this.service),
      update: new UpdateEntityTool(this.service),
      inspect: new InspectObjectTool(this.service)
    };

    // Initialize server
    this.server = new Server(
      {
        name: 'target-process-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {
            search_entities: true,
            get_entity: true,
            create_entity: true,
            update_entity: true,
            inspect_object: true
          },
          resources: {},
        },
      }
    );

    this.setupHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
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
      console.error('Building TargetProcess context...');
      this.context = await this.contextBuilder.buildContext();
      
      // Update resource provider with context
      this.resourceProvider = new ResourceProvider(this.service, this.context);
      console.error('TargetProcess context built successfully');
    } catch (error) {
      console.error('Cache/context initialization error:', error);
      // Non-fatal error, server can still function
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Get enhanced tool definitions with TP context
      const contextDescription = this.context 
        ? this.contextBuilder.generateContextDescription(this.context)
        : '';

      return {
        tools: [
          this.getEnhancedSearchDefinition(contextDescription),
          this.getEnhancedGetDefinition(contextDescription),
          this.getEnhancedCreateDefinition(contextDescription),
          this.getEnhancedUpdateDefinition(contextDescription),
          this.getEnhancedInspectDefinition(contextDescription),
        ],
      };
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
        switch (request.params.name) {
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
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    const timestamp = new Date().toISOString();
    console.error(`Target Process MCP server running on stdio (started at ${timestamp})`);
  }
}
