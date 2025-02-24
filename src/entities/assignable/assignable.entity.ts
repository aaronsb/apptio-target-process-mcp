import { GeneralEntity } from '../base/general.entity.js';
import { BaseEntityData, EntityState, Priority, Process, User, EntityReference } from '../base/base.types.js';

export interface AssignableEntityData {
  NumericPriority: number;
  Effort: number;
  EffortCompleted: number;
  EffortToDo: number;
  Progress: number;
  TimeSpent: number;
  TimeRemain: number;
  LastStateChangeDate: string;
  PlannedStartDate?: string;
  PlannedEndDate?: string;
  InitialEstimate: number;
  EntityState: EntityState;
  Priority: Priority;
  Project: {
    Id: number;
    Name: string;
    Process: Process;
  };
  Owner?: User;
  Team?: EntityReference;
  ResponsibleTeam?: EntityReference;
}

/**
 * Base class for assignable entities (UserStory, Bug, Task, Feature)
 */
export abstract class AssignableEntity extends GeneralEntity {
  numericPriority: number;
  effort: number;
  effortCompleted: number;
  effortToDo: number;
  progress: number;
  timeSpent: number;
  timeRemain: number;
  lastStateChangeDate: Date;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  initialEstimate: number;
  entityState: EntityState;
  priority: Priority;
  project: {
    id: number;
    name: string;
    process: Process;
  };
  owner?: User;
  team?: EntityReference;
  responsibleTeam?: EntityReference;

  constructor(baseData: BaseEntityData, assignableData: AssignableEntityData) {
    super(baseData);

    this.numericPriority = assignableData.NumericPriority;
    this.effort = assignableData.Effort;
    this.effortCompleted = assignableData.EffortCompleted;
    this.effortToDo = assignableData.EffortToDo;
    this.progress = assignableData.Progress;
    this.timeSpent = assignableData.TimeSpent;
    this.timeRemain = assignableData.TimeRemain;
    this.lastStateChangeDate = new Date(assignableData.LastStateChangeDate);
    this.plannedStartDate = assignableData.PlannedStartDate ? new Date(assignableData.PlannedStartDate) : undefined;
    this.plannedEndDate = assignableData.PlannedEndDate ? new Date(assignableData.PlannedEndDate) : undefined;
    this.initialEstimate = assignableData.InitialEstimate;
    this.entityState = assignableData.EntityState;
    this.priority = assignableData.Priority;
    this.project = {
      id: assignableData.Project.Id,
      name: assignableData.Project.Name,
      process: assignableData.Project.Process
    };
    this.owner = assignableData.Owner;
    this.team = assignableData.Team;
    this.responsibleTeam = assignableData.ResponsibleTeam;
  }

  /**
   * Convert entity to API format
   */
  toApiFormat(): Record<string, unknown> {
    return {
      ...super.toApiFormat(),
      NumericPriority: this.numericPriority,
      Effort: this.effort,
      EffortCompleted: this.effortCompleted,
      EffortToDo: this.effortToDo,
      Progress: this.progress,
      TimeSpent: this.timeSpent,
      TimeRemain: this.timeRemain,
      LastStateChangeDate: this.lastStateChangeDate.toISOString(),
      PlannedStartDate: this.plannedStartDate?.toISOString(),
      PlannedEndDate: this.plannedEndDate?.toISOString(),
      InitialEstimate: this.initialEstimate,
      EntityState: this.entityState,
      Priority: this.priority,
      Project: {
        Id: this.project.id,
        Name: this.project.name,
        Process: this.project.process
      },
      Owner: this.owner,
      Team: this.team,
      ResponsibleTeam: this.responsibleTeam
    };
  }

  /**
   * Check if entity is in a specific state
   */
  isInState(stateName: string): boolean {
    return this.entityState.Name === stateName;
  }

  /**
   * Calculate remaining effort
   */
  getRemainingEffort(): number {
    return this.initialEstimate - this.effortCompleted;
  }

  /**
   * Check if entity is overdue
   */
  isOverdue(): boolean {
    if (!this.plannedEndDate) return false;
    return this.plannedEndDate < new Date();
  }
}
