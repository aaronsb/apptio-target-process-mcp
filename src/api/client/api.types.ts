import { BaseEntityData } from '../../entities/base/base.types.js';

export interface ApiResponse<T> {
  Items?: T[];
  Next?: string;
}

export interface ApiEntityResponse<T extends BaseEntityData> {
  data: T;
}

export interface CreateEntityRequest {
  Name: string;
  Description?: string;
  Project?: {
    Id: number;
  };
  Team?: {
    Id: number;
  };
  AssignedUser?: {
    Id: number;
  };
  // Time entity specific fields
  Spent?: number;
  User?: {
    Id: number;
  };
  Assignable?: {
    Id: number;
  };
  Date?: string;
  // Comment entity specific fields
  General?: {
    Id: number;
  };
  // Allow additional dynamic properties for other entity types
  [key: string]: any;
}

export interface UpdateEntityRequest {
  Name?: string;
  Description?: string;
  EntityState?: {
    Id: number;
  };
  AssignedUser?: {
    Id: number;
  };
}
