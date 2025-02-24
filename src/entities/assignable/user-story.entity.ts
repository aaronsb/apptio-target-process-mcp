import { AssignableEntity, AssignableEntityData } from './assignable.entity.js';
import { BaseEntityData, EntityReference } from '../base/base.types.js';

export interface UserStoryData extends AssignableEntityData {
  Feature?: EntityReference;
  Tasks?: EntityReference[];
  Bugs?: EntityReference[];
}

/**
 * UserStory entity implementation
 */
export class UserStory extends AssignableEntity {
  feature?: EntityReference;
  tasks: EntityReference[];
  bugs: EntityReference[];

  constructor(baseData: BaseEntityData, assignableData: AssignableEntityData, storyData: UserStoryData) {
    super(baseData, assignableData);

    this.feature = storyData.Feature;
    this.tasks = storyData.Tasks || [];
    this.bugs = storyData.Bugs || [];
  }

  /**
   * Convert entity to API format
   */
  toApiFormat(): Record<string, unknown> {
    return {
      ...super.toApiFormat(),
      Feature: this.feature,
      Tasks: this.tasks,
      Bugs: this.bugs
    };
  }

  /**
   * Check if story has any blocking bugs
   */
  hasBlockingBugs(): boolean {
    return this.bugs.length > 0;
  }

  /**
   * Get total task effort
   */
  getTasksEffort(): number {
    // Note: This would require fetching full task data
    // Currently just returns count as placeholder
    return this.tasks.length;
  }

  /**
   * Check if story is ready for development
   * (has feature assigned and no blocking bugs)
   */
  isReadyForDev(): boolean {
    return !!this.feature && !this.hasBlockingBugs();
  }

  /**
   * Add a task reference
   */
  addTask(task: EntityReference): void {
    this.tasks.push(task);
  }

  /**
   * Add a bug reference
   */
  addBug(bug: EntityReference): void {
    this.bugs.push(bug);
  }

  /**
   * Remove a task reference
   */
  removeTask(taskId: number): void {
    this.tasks = this.tasks.filter(t => t.Id !== taskId);
  }

  /**
   * Remove a bug reference
   */
  removeBug(bugId: number): void {
    this.bugs = this.bugs.filter(b => b.Id !== bugId);
  }
}
