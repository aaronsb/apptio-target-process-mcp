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
