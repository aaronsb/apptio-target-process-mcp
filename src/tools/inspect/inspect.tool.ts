import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TPService } from '../../api/client/tp.service.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../../utils/logger.js';

const execAsync = promisify(exec);

// Input schema for inspect object tool
export const inspectObjectSchema = z.object({
  action: z.string().describe('Action to perform: list_types, get_properties, get_property_details, or discover_api_structure'),
  entityType: z.string().optional().describe('Type of entity to inspect (required for get_properties and get_property_details)'),
  propertyName: z.string().optional().describe('Name of property to get details for (required for get_property_details)'),
});

export type InspectObjectInput = z.infer<typeof inspectObjectSchema>;

/**
 * Handler for the inspect object tool
 */
export class InspectObjectTool {
  constructor(private service: TPService) {}

  async execute(args: unknown) {
    try {
      const { action, entityType, propertyName } = inspectObjectSchema.parse(args);

      // Validate action
      const validActions = ['list_types', 'get_properties', 'get_property_details', 'discover_api_structure'];
      if (!validActions.includes(action)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid action: ${action}. Valid actions are: ${validActions.join(', ')}`
        );
      }

      switch (action) {
        case 'list_types':
          return await this.listEntityTypes();
        case 'get_properties':
          if (!entityType) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'entityType is required for get_properties action'
            );
          }
          return await this.getEntityProperties(entityType);
        case 'get_property_details':
          if (!entityType || !propertyName) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'entityType and propertyName are required for get_property_details action'
            );
          }
          return await this.getPropertyDetails(entityType, propertyName);
        case 'discover_api_structure':
          return await this.discoverApiStructure();
        default:
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unknown action: ${action}`
          );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid inspect object parameters: ${error.message}`
        );
      }

      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Inspect object failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List all available entity types
   */
  private async listEntityTypes() {
    try {
      // Fetch metadata from the API
      const response = await this.service.fetchMetadata();
      
      // Extract entity types from the metadata
      const entityTypes = this.extractEntityTypes(response);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(entityTypes, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to list entity types: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get properties for a specific entity type
   */
  private async getEntityProperties(entityType: string) {
    try {
      // Fetch metadata from the API
      const response = await this.service.fetchMetadata();
      
      // Extract properties for the specified entity type
      const properties = this.extractEntityProperties(response, entityType);

      // Search documentation for additional context
      const docContext = await this.searchDocumentation(entityType);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              entityType,
              properties,
              documentation: docContext,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get properties for entity type ${entityType}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get detailed information about a specific property
   */
  private async getPropertyDetails(entityType: string, propertyName: string) {
    try {
      // Fetch metadata from the API
      const response = await this.service.fetchMetadata();
      
      // Extract property details
      const propertyDetails = this.extractPropertyDetails(response, entityType, propertyName);

      // Search documentation for additional context
      const docContext = await this.searchDocumentation(`${entityType} ${propertyName}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              entityType,
              propertyName,
              details: propertyDetails,
              documentation: docContext,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Failed to get details for property ${propertyName} of entity type ${entityType}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract entity types from metadata
   */
  private extractEntityTypes(metadata: any): string[] {
    // Implementation will depend on the structure of the metadata
    // This is a placeholder
    const entityTypes: string[] = [];
    
    if (metadata && metadata.Items) {
      for (const item of metadata.Items) {
        if (item.Name && !entityTypes.includes(item.Name)) {
          entityTypes.push(item.Name);
        }
      }
    }
    
    return entityTypes.sort();
  }

  /**
   * Extract properties for a specific entity type
   */
  private extractEntityProperties(metadata: any, entityType: string): Record<string, any> {
    // Implementation will depend on the structure of the metadata
    // This is a placeholder
    const properties: Record<string, any> = {};
    
    if (metadata && metadata.Items) {
      const entityMeta = metadata.Items.find((item: any) => item.Name === entityType);
      
      if (entityMeta && entityMeta.Fields) {
        for (const field of entityMeta.Fields) {
          properties[field.Name] = {
            type: field.Type,
            isRequired: field.IsRequired,
            isReadOnly: field.IsReadOnly,
          };
        }
      }
    }
    
    return properties;
  }

  /**
   * Extract detailed information about a specific property
   */
  private extractPropertyDetails(metadata: any, entityType: string, propertyName: string): any {
    // Implementation will depend on the structure of the metadata
    // This is a placeholder
    let propertyDetails = null;
    
    if (metadata && metadata.Items) {
      const entityMeta = metadata.Items.find((item: any) => item.Name === entityType);
      
      if (entityMeta && entityMeta.Fields) {
        const field = entityMeta.Fields.find((f: any) => f.Name === propertyName);
        
        if (field) {
          propertyDetails = {
            name: field.Name,
            type: field.Type,
            isRequired: field.IsRequired,
            isReadOnly: field.IsReadOnly,
            description: field.Description,
            allowedValues: field.AllowedValues,
          };
        }
      }
    }
    
    return propertyDetails;
  }

  /**
   * Search documentation for additional context
   */
  private async searchDocumentation(searchTerm: string): Promise<string> {
    try {
      const docsPath = path.resolve(__dirname, '../../../resources/target-process-docs');
      const { stdout } = await execAsync(`cd ${docsPath} && ./search-docs.sh "${searchTerm}"`);
      
      // Extract relevant information from the search results
      return this.extractDocumentationContext(stdout);
    } catch (error) {
      logger.error('Error searching documentation:', error);
      return 'Documentation search failed or no results found.';
    }
  }

  /**
   * Extract relevant information from documentation search results
   */
  private extractDocumentationContext(searchResults: string): string {
    // Extract the most relevant parts of the search results
    // This is a simple implementation that returns the first 1000 characters
    return searchResults.substring(0, 1000) + (searchResults.length > 1000 ? '...' : '');
  }

  /**
   * Discover API structure through controlled error triggering
   * This method intentionally triggers an error to extract entity type information
   */
  private async discoverApiStructure() {
    try {
      // First try to get entity types directly if possible
      try {
        const metadata = await this.service.fetchMetadata();
        const entityTypes = this.extractEntityTypes(metadata);
        
        if (entityTypes.length > 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  entityTypes
                }, null, 2),
              },
            ],
          };
        }
      } catch (metadataError) {
        logger.error('Failed to fetch metadata directly:', metadataError);
      }
      
      // If direct method failed, try to trigger an informative error
      // by attempting to get a non-existent entity type
      try {
        await this.service.getEntity('NonExistentType', 1);
        
        // If no error, return empty result
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                entityTypes: []
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        // Extract entity types from the error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        const entityTypeMatch = errorMessage.match(/Valid entity types are: (.*)/);
        const entityTypes = entityTypeMatch && entityTypeMatch[1] 
          ? entityTypeMatch[1].split(', ') 
          : [];
        
        // Return just the extracted data
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                entityTypes
              }, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      // Handle any unexpected errors
      logger.error('Error in discoverApiStructure:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to discover API structure',
              message: error instanceof Error ? error.message : String(error),
              entityTypes: []
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Get tool definition for MCP
   */
  static getDefinition() {
    return {
      name: 'inspect_object',
      description: 'Inspect TargetProcess API metadata. Use "list_types" to see all entity types, "get_properties" to see fields for an entity type, "discover_api_structure" for quick entity discovery.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Action: "list_types" (all entities), "get_properties" (fields for entity), "get_property_details" (field details), "discover_api_structure" (quick discovery)',
          },
          entityType: {
            type: 'string',
            description: 'Type of entity to inspect (required for get_properties and get_property_details)',
          },
          propertyName: {
            type: 'string',
            description: 'Name of property to get details for (required for get_property_details)',
          },
        },
        required: ['action'],
      },
    } as const;
  }
}
