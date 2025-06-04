/**
 * Repository pattern interfaces for entity operations
 * Provides abstraction over data access layer
 */

import { SearchParams } from './tp-service.interface.js';

/**
 * Base repository interface for all entities
 */
export interface IEntityRepository<T> {
  /**
   * Find entities matching criteria
   */
  find(params?: SearchParams): Promise<T[]>;
  
  /**
   * Find a single entity by ID
   */
  findById(id: number, include?: string[]): Promise<T | null>;
  
  /**
   * Create a new entity
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: number, data: Partial<T>): Promise<T>;
  
  /**
   * Delete an entity
   */
  delete(id: number): Promise<boolean>;
  
  /**
   * Count entities matching criteria
   */
  count(params?: SearchParams): Promise<number>;
  
  /**
   * Check if entity exists
   */
  exists(id: number): Promise<boolean>;
}

/**
 * Repository for assignable entities (work items)
 */
export interface IAssignableRepository<T> extends IEntityRepository<T> {
  /**
   * Find by assigned user
   */
  findByAssignedUser(userId: number, params?: SearchParams): Promise<T[]>;
  
  /**
   * Find by project
   */
  findByProject(projectId: number, params?: SearchParams): Promise<T[]>;
  
  /**
   * Find by state
   */
  findByState(stateName: string, params?: SearchParams): Promise<T[]>;
  
  /**
   * Assign to user
   */
  assignToUser(entityId: number, userId: number): Promise<T>;
  
  /**
   * Change state
   */
  changeState(entityId: number, stateId: number): Promise<T>;
}

/**
 * Unit of work pattern for managing transactions
 */
export interface IUnitOfWork {
  /**
   * Get repository for entity type
   */
  getRepository<T>(entityType: string): IEntityRepository<T>;
  
  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;
  
  /**
   * Commit changes
   */
  commit(): Promise<void>;
  
  /**
   * Rollback changes
   */
  rollback(): Promise<void>;
  
  /**
   * Execute in transaction
   */
  executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

/**
 * Factory for creating repositories
 */
export interface IRepositoryFactory {
  /**
   * Create repository for entity type
   */
  create<T>(entityType: string): IEntityRepository<T>;
  
  /**
   * Create assignable repository
   */
  createAssignable<T>(entityType: string): IAssignableRepository<T>;
}