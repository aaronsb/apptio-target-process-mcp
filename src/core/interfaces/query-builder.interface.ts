/**
 * Interface for building Targetprocess queries
 * Provides a fluent API for constructing complex where clauses
 */

export enum Operator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'not in',
  IS_NULL = 'is null',
  IS_NOT_NULL = 'is not null'
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or'
}

/**
 * Represents a single condition in a query
 */
export interface QueryCondition {
  field: string;
  operator: Operator;
  value?: any;
}

/**
 * Represents a group of conditions
 */
export interface QueryGroup {
  conditions: (QueryCondition | QueryGroup)[];
  operator: LogicalOperator;
}

/**
 * Query builder interface for constructing Targetprocess queries
 */
export interface IQueryBuilder {
  /**
   * Add a where condition
   */
  where(field: string): IQueryConditionBuilder;
  
  /**
   * Add an AND condition
   */
  and(field: string): IQueryConditionBuilder;
  
  /**
   * Add an OR condition
   */
  or(field: string): IQueryConditionBuilder;
  
  /**
   * Start a grouped condition
   */
  group(callback: (builder: IQueryBuilder) => void): IQueryBuilder;
  
  /**
   * Add ordering
   */
  orderBy(field: string, direction?: 'asc' | 'desc'): IQueryBuilder;
  
  /**
   * Add multiple order by clauses
   */
  orderByMultiple(orders: Array<{ field: string; direction?: 'asc' | 'desc' }>): IQueryBuilder;
  
  /**
   * Set the number of results to take
   */
  take(count: number): IQueryBuilder;
  
  /**
   * Set the number of results to skip
   */
  skip(count: number): IQueryBuilder;
  
  /**
   * Add fields to include
   */
  include(...fields: string[]): IQueryBuilder;
  
  /**
   * Build the query string
   */
  build(): string;
  
  /**
   * Get the query parameters as an object
   */
  toParams(): Record<string, any>;
  
  /**
   * Reset the builder
   */
  reset(): IQueryBuilder;
}

/**
 * Interface for building individual conditions
 */
export interface IQueryConditionBuilder {
  equals(value: any): IQueryBuilder;
  notEquals(value: any): IQueryBuilder;
  greaterThan(value: any): IQueryBuilder;
  lessThan(value: any): IQueryBuilder;
  greaterThanOrEqual(value: any): IQueryBuilder;
  lessThanOrEqual(value: any): IQueryBuilder;
  contains(value: string): IQueryBuilder;
  in(values: any[]): IQueryBuilder;
  notIn(values: any[]): IQueryBuilder;
  isNull(): IQueryBuilder;
  isNotNull(): IQueryBuilder;
}

/**
 * Factory for creating query builders
 */
export interface IQueryBuilderFactory {
  /**
   * Create a new query builder
   */
  create(): IQueryBuilder;
  
  /**
   * Create a query builder with preset conditions
   */
  createWithPreset(preset: string, variables?: Record<string, any>): IQueryBuilder;
}