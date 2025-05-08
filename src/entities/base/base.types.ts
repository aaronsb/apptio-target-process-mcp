/**
 * Common types used across entities
 */

export interface EntityReference {
  Id: number;
  Name?: string;
}

export interface CustomField {
  Name: string;
  Type: string;
  Value: string | number | boolean | null | EntityReference | EntityReference[];
}

export interface EntityState extends EntityReference {
  NumericPriority: number;
}

export interface Process extends EntityReference {
  Name: string;
}

export interface User extends EntityReference {
  FirstName: string;
  LastName: string;
  Login: string;
}

export interface Priority extends EntityReference {
  Importance: number;
}

export type ResourceType = 
  | 'UserStory'
  | 'Bug'
  | 'Task'
  | 'Feature'
  | 'Epic'
  | 'PortfolioEpic'
  | 'Solution'
  | 'Request'
  | 'Impediment'
  | 'TestCase'
  | 'TestPlan'
  | 'Project'
  | 'Team'
  | 'Iteration'
  | 'TeamIteration'
  | 'Release'
  | 'Program'
  | 'EntityState'
  | 'Priority'
  | 'Process'
  | 'GeneralUser'
  | 'Comment'
  | 'Attachment'
  | 'TimeSheet';

export interface BaseEntityData {
  Id: number;
  Name: string;
  Description?: string;
  StartDate?: string;
  EndDate?: string;
  CreateDate: string;
  ModifyDate: string;
  LastCommentDate?: string;
  Tags?: string[];
  CustomFields?: CustomField[];
  ResourceType: ResourceType;
}
