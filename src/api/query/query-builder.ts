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

    // Add orderBy parameters - handle multiple fields with array syntax
    if (this.queryOptions.orderBy?.length) {
      const orderByFields = this.queryOptions.orderBy as string[];
      if (orderByFields.length === 1) {
        // Single field - use standard orderBy parameter
        params.append('orderBy', this.formatSingleOrderBy(orderByFields[0]));
      } else {
        // Multiple fields - use array syntax: orderBy[0]=field1&orderBy[1]=field2
        orderByFields.forEach((field, index) => {
          params.append(`orderBy[${index}]`, this.formatSingleOrderBy(field));
        });
      }
    }

    // Add authentication if using API key
    if (this.authConfig.type === 'apikey') {
      params.append('access_token', this.authConfig.token);
    }

    return params;
  }

  /**
   * Build query string for API requests
   * Special handling for array-style parameters that URLSearchParams doesn't handle well
   */
  buildQueryString(): string {
    // For queries with multiple orderBy fields, build manually to avoid encoding issues
    if (this.queryOptions.orderBy && (this.queryOptions.orderBy as string[]).length > 1) {
      return this.buildQueryStringManual();
    }
    return this.buildParams().toString();
  }

  /**
   * Manually build query string to handle array-style parameters
   */
  private buildQueryStringManual(): string {
    const parts: string[] = [];

    // Add format
    parts.push(`format=${this.queryOptions.format || 'json'}`);

    // Add take
    if (this.queryOptions.take) {
      parts.push(`take=${this.queryOptions.take}`);
    }

    // Add where (encode it)
    if (this.queryOptions.where) {
      parts.push(`where=${encodeURIComponent(this.queryOptions.where)}`);
    }

    // Add include (encode it)
    if (this.queryOptions.include?.length) {
      parts.push(`include=${encodeURIComponent(this.validateInclude(this.queryOptions.include))}`);
    }

    // Add orderBy fields with array syntax (no encoding on field names)
    if (this.queryOptions.orderBy?.length) {
      const orderByFields = this.queryOptions.orderBy as string[];
      orderByFields.forEach((field, index) => {
        parts.push(`orderBy[${index}]=${this.formatSingleOrderBy(field)}`);
      });
    }

    // Add auth token if needed
    if (this.authConfig.type === 'apikey') {
      parts.push(`access_token=${this.authConfig.token}`);
    }

    return parts.join('&');
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
   * Format a single orderBy field
   * TargetProcess API only accepts field names, no direction keywords
   */
  private formatSingleOrderBy(field: string | OrderByOption): string {
    if (typeof field === 'string') {
      // Remove any direction keywords that might be present
      return field.replace(/\s+(desc|asc)$/i, '').trim();
    }
    return field.field; // For object format, just return the field name
  }

  /**
   * Formats orderBy parameters according to TargetProcess rules
   * @deprecated Use formatSingleOrderBy instead
   */
  private formatOrderBy(orderBy: OrderByOption[]): string {
    return orderBy.map(item => this.formatSingleOrderBy(item)).join(',');
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