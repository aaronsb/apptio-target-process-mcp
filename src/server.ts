import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

import { TPService, TPServiceConfig } from './api/client/tp.service.js';
import { SearchTool } from './tools/search/search.tool.js';
import { GetEntityTool } from './tools/entity/get.tool.js';
import { CreateEntityTool } from './tools/entity/create.tool.js';
import { UpdateEntityTool } from './tools/update/update.tool.js';

function loadConfig(): TPServiceConfig {
  // Try environment variables first
  if (process.env.TP_DOMAIN && process.env.TP_USERNAME && process.env.TP_PASSWORD) {
    return {
      domain: process.env.TP_DOMAIN,
      credentials: {
        username: process.env.TP_USERNAME,
        password: process.env.TP_PASSWORD
      }
    };
  }

  // Fall back to config file
  const configPath = path.join(process.cwd(), 'config', 'targetprocess.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('No configuration found. Please set environment variables (TP_DOMAIN, TP_USERNAME, TP_PASSWORD) or create config/targetprocess.json');
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export class TargetProcessServer {
  private server: Server;
  private service: TPService;
  private tools: {
    search: SearchTool;
    get: GetEntityTool;
    create: CreateEntityTool;
    update: UpdateEntityTool;
  };

  constructor() {
    // Initialize service
    const config = loadConfig();
    this.service = new TPService(config);

    // Initialize tools
    this.tools = {
      search: new SearchTool(this.service),
      get: new GetEntityTool(this.service),
      create: new CreateEntityTool(this.service),
      update: new UpdateEntityTool(this.service)
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
            update_entity: true
          },
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
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        SearchTool.getDefinition(),
        GetEntityTool.getDefinition(),
        CreateEntityTool.getDefinition(),
        UpdateEntityTool.getDefinition(),
      ],
    }));

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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Target Process MCP server running on stdio');
  }
}
