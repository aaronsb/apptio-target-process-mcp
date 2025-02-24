#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Targetprocess } from "targetprocess-rest-api";
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface TPConfig {
  domain: string;
  credentials: {
    username: string;
    password: string;
  };
}

function loadConfig(): TPConfig {
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

// Load configuration and initialize clients
const config = loadConfig();
const { domain, credentials: { username, password } } = config;

// Initialize TargetProcess client
const tp = new Targetprocess(domain, username, password);

// Initialize fetch client for raw API calls
const auth = Buffer.from(`${username}:${password}`).toString('base64');

// Input schemas for tools
const searchEntitiesSchema = z.object({
  type: z.enum(['UserStory', 'Bug', 'Task', 'Feature']),
  where: z.string().optional(),
  include: z.array(z.string()).optional(),
  take: z.number().min(1).max(1000).optional(),
  orderBy: z.array(z.string()).optional(),
});

const getEntitySchema = z.object({
  type: z.enum(['UserStory', 'Bug', 'Task', 'Feature']),
  id: z.number(),
  include: z.array(z.string()).optional(),
});

const createEntitySchema = z.object({
  type: z.enum(['UserStory', 'Bug', 'Task', 'Feature']),
  name: z.string(),
  description: z.string().optional(),
  project: z.object({
    id: z.number(),
  }),
  team: z.object({
    id: z.number(),
  }).optional(),
  assignedUser: z.object({
    id: z.number(),
  }).optional(),
});

const updateEntitySchema = z.object({
  type: z.enum(['UserStory', 'Bug', 'Task', 'Feature']),
  id: z.number(),
  fields: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.object({
      id: z.number(),
    }).optional(),
    assignedUser: z.object({
      id: z.number(),
    }).optional(),
  }),
});

class TargetProcessServer {
  private server: Server;

  constructor() {
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

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_entities',
          description: 'Search Target Process entities with filtering and includes',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['UserStory', 'Bug', 'Task', 'Feature'],
                description: 'Type of entity to search',
              },
              where: {
                type: 'string',
                description: 'Filter expression (Target Process query language)',
              },
              include: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Related data to include (e.g., Project, Team, AssignedUser)',
              },
              take: {
                type: 'number',
                description: 'Number of items to return (max 1000)',
                minimum: 1,
                maximum: 1000,
              },
              orderBy: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Fields to sort by (e.g., ["CreateDate desc", "Name"])',
              },
            },
            required: ['type'],
          },
        },
        {
          name: 'get_entity',
          description: 'Get details of a specific Target Process entity',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['UserStory', 'Bug', 'Task', 'Feature'],
                description: 'Type of entity to retrieve',
              },
              id: {
                type: 'number',
                description: 'ID of the entity',
              },
              include: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Related data to include',
              },
            },
            required: ['type', 'id'],
          },
        },
        {
          name: 'create_entity',
          description: 'Create a new Target Process entity',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['UserStory', 'Bug', 'Task', 'Feature'],
                description: 'Type of entity to create',
              },
              name: {
                type: 'string',
                description: 'Name/title of the entity',
              },
              description: {
                type: 'string',
                description: 'Description of the entity',
              },
              project: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    description: 'Project ID',
                  },
                },
                required: ['id'],
              },
              team: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    description: 'Team ID',
                  },
                },
              },
              assignedUser: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    description: 'User ID to assign',
                  },
                },
              },
            },
            required: ['type', 'name', 'project'],
          },
        },
        {
          name: 'update_entity',
          description: 'Update an existing Target Process entity',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['UserStory', 'Bug', 'Task', 'Feature'],
                description: 'Type of entity to update',
              },
              id: {
                type: 'number',
                description: 'ID of the entity to update',
              },
              fields: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'New name for the entity',
                  },
                  description: {
                    type: 'string',
                    description: 'New description for the entity',
                  },
                  status: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number',
                        description: 'Status ID to set',
                      },
                    },
                    required: ['id'],
                  },
                  assignedUser: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number',
                        description: 'User ID to assign',
                      },
                    },
                    required: ['id'],
                  },
                },
              },
            },
            required: ['type', 'id', 'fields'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request, _extra) => {
      try {
        switch (request.params.name) {
          case 'search_entities':
            return await this.handleSearchEntities(request.params.arguments);
          case 'get_entity':
            return await this.handleGetEntity(request.params.arguments);
          case 'create_entity':
            return await this.handleCreateEntity(request.params.arguments);
          case 'update_entity':
            return await this.handleUpdateEntity(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
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

  private async handleSearchEntities(args: unknown) {
    const { type, take = 10, include = [] } = searchEntitiesSchema.parse(args);
    
    try {
      const response = await fetch(`https://${domain}/api/v1/${type}s?format=json&take=${take}${include.length ? `&include=[${include.join(',')}]` : ''}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to search ${type}s: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleGetEntity(args: unknown) {
    const { type, id, include = [] } = getEntitySchema.parse(args);
    
    try {
      const response = await fetch(`https://${domain}/api/v1/${type}s/${id}?format=json${include.length ? `&include=[${include.join(',')}]` : ''}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get ${type} ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleCreateEntity(args: unknown) {
    const { type, ...data } = createEntitySchema.parse(args);
    
    try {
      const response = await fetch(`https://${domain}/api/v1/${type}s`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to create ${type}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleUpdateEntity(args: unknown) {
    const { type, id, fields } = updateEntitySchema.parse(args);
    
    try {
      const response = await fetch(`https://${domain}/api/v1/${type}s/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fields)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to update ${type} ${id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Target Process MCP server running on stdio');
  }
}

const server = new TargetProcessServer();
server.run().catch(console.error);
