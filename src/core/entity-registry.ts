/**
 * Central registry for all Targetprocess entity types and their metadata.
 * This eliminates duplication across the codebase and provides a single source of truth.
 */

export enum EntityCategory {
  ASSIGNABLE = 'assignable',
  PROJECT = 'project', 
  PLANNING = 'planning',
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

export interface EntityTypeInfo {
  name: string;
  category: EntityCategory;
  description: string;
  supportsCustomFields: boolean;
  parentTypes?: string[];
  commonIncludes?: string[];
}

export class EntityRegistry {
  private static readonly ENTITY_TYPES: Map<string, EntityTypeInfo> = new Map([
    // Assignable entities (work items that can be assigned to users)
    ['UserStory', {
      name: 'UserStory',
      category: EntityCategory.ASSIGNABLE,
      description: 'User stories represent features from the user perspective',
      supportsCustomFields: true,
      parentTypes: ['Feature', 'Epic'],
      commonIncludes: ['Project', 'Feature', 'EntityState', 'Priority', 'AssignedUser', 'Team']
    }],
    
    ['Bug', {
      name: 'Bug',
      category: EntityCategory.ASSIGNABLE,
      description: 'Bugs track defects and issues',
      supportsCustomFields: true,
      parentTypes: ['UserStory', 'Feature'],
      commonIncludes: ['Project', 'UserStory', 'EntityState', 'Priority', 'Severity', 'AssignedUser']
    }],
    
    ['Task', {
      name: 'Task',
      category: EntityCategory.ASSIGNABLE,
      description: 'Tasks represent work items within user stories',
      supportsCustomFields: true,
      parentTypes: ['UserStory'],
      commonIncludes: ['UserStory', 'EntityState', 'AssignedUser']
    }],
    
    ['Feature', {
      name: 'Feature',
      category: EntityCategory.ASSIGNABLE,
      description: 'Features group related user stories',
      supportsCustomFields: true,
      parentTypes: ['Epic'],
      commonIncludes: ['Project', 'Epic', 'EntityState', 'AssignedUser']
    }],
    
    ['Epic', {
      name: 'Epic',
      category: EntityCategory.ASSIGNABLE,
      description: 'Epics represent large bodies of work',
      supportsCustomFields: true,
      parentTypes: ['Project'],
      commonIncludes: ['Project', 'EntityState', 'AssignedUser']
    }],
    
    ['TestCase', {
      name: 'TestCase',
      category: EntityCategory.ASSIGNABLE,
      description: 'Test cases for quality assurance',
      supportsCustomFields: true,
      parentTypes: ['UserStory'],
      commonIncludes: ['UserStory', 'Project', 'AssignedUser']
    }],
    
    ['TestPlan', {
      name: 'TestPlan',
      category: EntityCategory.ASSIGNABLE,
      description: 'Test plans organize test cases',
      supportsCustomFields: true,
      commonIncludes: ['Project', 'Release', 'TestCases']
    }],
    
    ['Request', {
      name: 'Request',
      category: EntityCategory.ASSIGNABLE,
      description: 'Customer requests and feedback',
      supportsCustomFields: true,
      commonIncludes: ['Project', 'EntityState', 'AssignedUser']
    }],
    
    // Project management entities
    ['Project', {
      name: 'Project',
      category: EntityCategory.PROJECT,
      description: 'Projects contain all work items',
      supportsCustomFields: true,
      commonIncludes: ['Program', 'Process', 'EntityState']
    }],
    
    ['Program', {
      name: 'Program',
      category: EntityCategory.PROJECT,
      description: 'Programs group related projects',
      supportsCustomFields: true,
      commonIncludes: ['Projects']
    }],
    
    ['Team', {
      name: 'Team',
      category: EntityCategory.PROJECT,
      description: 'Teams work on projects',
      supportsCustomFields: true,
      commonIncludes: ['TeamMembers', 'Projects']
    }],
    
    // Planning entities
    ['Iteration', {
      name: 'Iteration',
      category: EntityCategory.PLANNING,
      description: 'Iterations represent sprints or time boxes',
      supportsCustomFields: true,
      commonIncludes: ['Project', 'UserStories', 'Tasks', 'Bugs']
    }],
    
    ['Release', {
      name: 'Release',
      category: EntityCategory.PLANNING,
      description: 'Releases group work for deployment',
      supportsCustomFields: true,
      commonIncludes: ['Project', 'Features', 'UserStories']
    }],
    
    ['TeamIteration', {
      name: 'TeamIteration',
      category: EntityCategory.PLANNING,
      description: 'Team-specific iteration planning',
      supportsCustomFields: true,
      commonIncludes: ['Team', 'Iteration']
    }],
    
    // System entities
    ['GeneralUser', {
      name: 'GeneralUser',
      category: EntityCategory.SYSTEM,
      description: 'System users',
      supportsCustomFields: false,
      commonIncludes: ['Teams', 'Role']
    }],
    
    ['EntityState', {
      name: 'EntityState',
      category: EntityCategory.SYSTEM,
      description: 'Workflow states',
      supportsCustomFields: false,
      commonIncludes: ['Process', 'EntityType']
    }],
    
    ['Priority', {
      name: 'Priority',
      category: EntityCategory.SYSTEM,
      description: 'Priority levels',
      supportsCustomFields: false
    }],
    
    ['Severity', {
      name: 'Severity',
      category: EntityCategory.SYSTEM,
      description: 'Bug severity levels',
      supportsCustomFields: false
    }],
    
    ['Role', {
      name: 'Role',
      category: EntityCategory.SYSTEM,
      description: 'User roles',
      supportsCustomFields: false
    }],
    
    ['Process', {
      name: 'Process',
      category: EntityCategory.SYSTEM,
      description: 'Development process templates',
      supportsCustomFields: false
    }]
  ]);

  /**
   * Get all registered entity types
   */
  static getAllEntityTypes(): string[] {
    return Array.from(this.ENTITY_TYPES.keys());
  }

  /**
   * Get entity types by category
   */
  static getEntityTypesByCategory(category: EntityCategory): string[] {
    return Array.from(this.ENTITY_TYPES.entries())
      .filter(([_, info]) => info.category === category)
      .map(([name, _]) => name);
  }

  /**
   * Get assignable entity types (work items)
   */
  static getAssignableEntityTypes(): string[] {
    return this.getEntityTypesByCategory(EntityCategory.ASSIGNABLE);
  }

  /**
   * Check if an entity type is valid
   */
  static isValidEntityType(entityType: string): boolean {
    return this.ENTITY_TYPES.has(entityType);
  }

  /**
   * Get entity type information
   */
  static getEntityTypeInfo(entityType: string): EntityTypeInfo | undefined {
    return this.ENTITY_TYPES.get(entityType);
  }

  /**
   * Get common includes for an entity type
   */
  static getCommonIncludes(entityType: string): string[] {
    const info = this.ENTITY_TYPES.get(entityType);
    return info?.commonIncludes || [];
  }

  /**
   * Check if entity type supports custom fields
   */
  static supportsCustomFields(entityType: string): boolean {
    const info = this.ENTITY_TYPES.get(entityType);
    return info?.supportsCustomFields || false;
  }

  /**
   * Get parent entity types
   */
  static getParentTypes(entityType: string): string[] {
    const info = this.ENTITY_TYPES.get(entityType);
    return info?.parentTypes || [];
  }

  /**
   * Register a custom entity type (for runtime discovery)
   */
  static registerCustomEntityType(entityType: string, info: Partial<EntityTypeInfo> = {}): void {
    this.ENTITY_TYPES.set(entityType, {
      name: entityType,
      category: EntityCategory.CUSTOM,
      description: info.description || `Custom entity type: ${entityType}`,
      supportsCustomFields: info.supportsCustomFields ?? true,
      parentTypes: info.parentTypes,
      commonIncludes: info.commonIncludes
    });
  }

  /**
   * Get a formatted list for tool documentation
   */
  static getEntityTypesForDocs(): string {
    const grouped = new Map<EntityCategory, string[]>();
    
    for (const [name, info] of this.ENTITY_TYPES) {
      const category = info.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(name);
    }

    const categoryNames = {
      [EntityCategory.ASSIGNABLE]: 'Work Items',
      [EntityCategory.PROJECT]: 'Project Management',
      [EntityCategory.PLANNING]: 'Planning',
      [EntityCategory.SYSTEM]: 'System',
      [EntityCategory.CUSTOM]: 'Custom'
    };

    let result = '';
    for (const [category, types] of grouped) {
      if (types.length > 0) {
        result += `${categoryNames[category]}: ${types.join(', ')}\n`;
      }
    }
    
    return result.trim();
  }
}