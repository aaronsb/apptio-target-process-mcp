import { FeatureModule } from '../../core/interfaces/semantic-operation.interface.js';
import { TPService } from '../../api/client/tp.service.js';
import { SearchWorkItemsOperation } from './search-work-items.js';
import { AddCommentOperation } from '../work/add-comment.js';
import { ShowCommentsOperation } from '../work/show-comments.js';
import { DeleteCommentOperation } from '../work/delete-comment.js';
import { AnalyzeAttachmentOperation } from './analyze-attachment.js';

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
    
    // Register shared operations (available to all roles with role-specific adaptations)
    const addComment = new AddCommentOperation(this.service);
    this._operations[addComment.metadata.id] = addComment;
    
    const showComments = new ShowCommentsOperation(this.service);
    this._operations[showComments.metadata.id] = showComments;
    
    const deleteComment = new DeleteCommentOperation(this.service);
    this._operations[deleteComment.metadata.id] = deleteComment;
    
    // Register attachment analysis
    const analyzeAttachment = new AnalyzeAttachmentOperation(this.service);
    this._operations[analyzeAttachment.metadata.id] = analyzeAttachment;
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