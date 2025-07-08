import { z } from 'zod';
import { getFullContent } from '../../utils/paginator.js';

export const showAllToolSchema = z.object({
  cacheKey: z.string().describe('Cache key from previous paginated result')
});

export type ShowAllToolInput = z.infer<typeof showAllToolSchema>;

/**
 * Show all results without pagination
 */
export class ShowAllTool {
  async execute(args: unknown) {
    const { cacheKey } = showAllToolSchema.parse(args);
    
    const fullText = getFullContent(cacheKey);
    
    return {
      content: [{
        type: 'text',
        text: fullText
      }]
    };
  }
}