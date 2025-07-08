import { z } from 'zod';
import { getNextPage } from '../../utils/paginator.js';

export const showMoreToolSchema = z.object({
  cacheKey: z.string().describe('Cache key from previous paginated result'),
  page: z.number().min(2).optional().describe('Specific page number to show (default: next page)')
});

export type ShowMoreToolInput = z.infer<typeof showMoreToolSchema>;

/**
 * Show more results from a paginated response
 */
export class ShowMoreTool {
  async execute(args: unknown) {
    const { cacheKey, page } = showMoreToolSchema.parse(args);
    
    const result = getNextPage(cacheKey, page);
    
    return {
      content: [{
        type: 'text',
        text: result.text
      }]
    };
  }
}