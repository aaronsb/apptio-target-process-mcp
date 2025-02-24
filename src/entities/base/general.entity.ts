import { BaseEntityData, CustomField, EntityReference, ResourceType } from './base.types.js';

/**
 * Base class for all TargetProcess entities
 */
export abstract class GeneralEntity {
  readonly id: number;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  readonly createDate: Date;
  readonly modifyDate: Date;
  lastCommentDate?: Date;
  tags: string[];
  customFields: CustomField[];
  readonly resourceType: ResourceType;

  constructor(data: BaseEntityData) {
    this.id = data.Id;
    this.name = data.Name;
    this.description = data.Description;
    this.startDate = data.StartDate ? new Date(data.StartDate) : undefined;
    this.endDate = data.EndDate ? new Date(data.EndDate) : undefined;
    this.createDate = new Date(data.CreateDate);
    this.modifyDate = new Date(data.ModifyDate);
    this.lastCommentDate = data.LastCommentDate ? new Date(data.LastCommentDate) : undefined;
    this.tags = data.Tags || [];
    this.customFields = data.CustomFields || [];
    this.resourceType = data.ResourceType;
  }

  /**
   * Convert entity to API format
   */
  toApiFormat(): Record<string, unknown> {
    return {
      Id: this.id,
      Name: this.name,
      Description: this.description,
      StartDate: this.startDate?.toISOString(),
      EndDate: this.endDate?.toISOString(),
      CreateDate: this.createDate.toISOString(),
      ModifyDate: this.modifyDate.toISOString(),
      LastCommentDate: this.lastCommentDate?.toISOString(),
      Tags: this.tags,
      CustomFields: this.customFields,
      ResourceType: this.resourceType
    };
  }

  /**
   * Create a reference to this entity
   */
  toReference(): EntityReference {
    return {
      Id: this.id,
      Name: this.name
    };
  }

  /**
   * Get a custom field value by name
   */
  getCustomField<T = any>(name: string): T | undefined {
    const field = this.customFields.find(f => f.Name === name);
    return field?.Value as T;
  }

  /**
   * Set a custom field value
   */
  setCustomField(name: string, value: any, type: string): void {
    const existingIndex = this.customFields.findIndex(f => f.Name === name);
    const field: CustomField = { Name: name, Type: type, Value: value };
    
    if (existingIndex >= 0) {
      this.customFields[existingIndex] = field;
    } else {
      this.customFields.push(field);
    }
  }
}
