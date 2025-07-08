import { FeatureModule } from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';
import { SearchWorkItemsOperation } from './search-work-items.js';

/**
 * General operations available to all users including default personality
 */
export class GeneralOperations implements FeatureModule {
  private _operations: Record<string, any> = {};

  constructor(private service: TPService) {
    this.initializeOperations();
  }

  metadata = {
    id: 'general-operations',
    name: 'General Operations',
    description: 'Basic operations available to all users',
    category: 'general',
    requiredPersonalities: ['default', 'all']
  };

  private initializeOperations(): void {
    // Register general operations
    const searchWorkItems = new SearchWorkItemsOperation(this.service);
    this._operations[searchWorkItems.metadata.id] = searchWorkItems;
  }

  get operations() {
    return this._operations;
  }

  async initialize(): Promise<void> {
    // No special initialization needed
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}