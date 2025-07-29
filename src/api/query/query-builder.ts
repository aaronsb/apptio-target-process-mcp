import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { URLSearchParams } from 'node:url';

type OrderByOption = string | { field: string; direction: 'asc' | 'desc' };

export interface QueryOptions {
  where?: string;
  include?: string[];
  take?: number;
  orderBy?: string[];
  format?: string;
}

export interface AuthConfig {
  type: 'basic' | 'apikey';
  token: string;
}

/**
 * Builder for constructing TargetProcess API queries with validation
 * Handles query parameter formatting, validation, and URL construction
 */
export class QueryBuilder {
  private queryOptions: QueryOptions = {};
  private authConfig: AuthConfig;

  constructor(authConfig: AuthConfig) {
    this.authConfig = authConfig;
  }

  /**
   * Set where clause with validation
   */
  where(whereClause: string): QueryBuilder {
    if (whereClause) {
      this.queryOptions.where = this.validateWhereClause(whereClause);
    }
    return this;
  }

  /**
   * Set include parameters with validation
   */
  include(includes: string[]): QueryBuilder {
    if (includes?.length) {
      this.queryOptions.include = includes;
    }
    return this;
  }

  /**
   * Set take (limit) parameter
   */
  take(limit: number): QueryBuilder {
    if (limit > 0) {
      this.queryOptions.take = limit;
    }
    return this;
  }

  /**
   * Set orderBy parameters
   */
  orderBy(fields: string[]): QueryBuilder {
    if (fields?.length) {
      this.queryOptions.orderBy = fields;
    }
    return this;
  }

  /**
   * Set response format
   */
  format(fmt: string): QueryBuilder {
    this.queryOptions.format = fmt;
    return this;
  }

  /**
   * Build URLSearchParams for the query
   */
  buildParams(): URLSearchParams {
    const params = new URLSearchParams();

    // Add format (default to json)
    params.append('format', this.queryOptions.format || 'json');

    // Add take parameter
    if (this.queryOptions.take) {
      params.append('take', this.queryOptions.take.toString());
    }

    // Add where clause
    if (this.queryOptions.where) {
      params.append('where', this.queryOptions.where);
    }

    // Add include parameters
    if (this.queryOptions.include?.length) {
      params.append('include', this.validateInclude(this.queryOptions.include));
    }

    // Add orderBy parameters
    if (this.queryOptions.orderBy?.length) {
      params.append('orderBy', this.formatOrderBy(this.queryOptions.orderBy as OrderByOption[]));
    }

    // Add authentication if using API key
    if (this.authConfig.type === 'apikey') {
      params.append('access_token', this.authConfig.token);
    }

    return params;
  }

  /**
   * Build query string for API requests
   */
  buildQueryString(): string {
    return this.buildParams().toString();
  }

  /**
   * Reset the builder for reuse
   */
  reset(): QueryBuilder {
    this.queryOptions = {};
    return this;
  }

  /**
   * Create a new QueryBuilder with the same auth config
   */
  clone(): QueryBuilder {
    return new QueryBuilder(this.authConfig);
  }

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
}