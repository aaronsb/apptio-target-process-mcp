/**
 * Simple text-based pagination utility
 */

interface PaginationResult {
  text: string;
  hasMore: boolean;
  totalItems: number;
  cacheKey?: string;
}

// Simple in-memory cache for pagination
const paginationCache = new Map<string, string>();

/**
 * Paginate text content by splitting on natural boundaries
 */
export function paginateText(
  text: string, 
  maxLines: number = 25,
  page: number = 1
): PaginationResult {
  
  // Check if this looks like a list (numbered items or bullet points)
  const lines = text.split('\n');
  const isNumberedList = lines.some(line => /^\d+\.\s/.test(line.trim()));
  const isBulletList = lines.some(line => /^[-*•]\s/.test(line.trim()));
  
  let items: string[];
  
  if (isNumberedList) {
    // Split on numbered items
    items = text.split(/(?=\n\d+\.\s)/).filter(item => item.trim());
  } else if (isBulletList) {
    // Split on bullet points
    items = text.split(/(?=\n[-*•]\s)/).filter(item => item.trim());
  } else {
    // Split on double newlines (paragraphs) or single lines if short
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    if (paragraphs.length > 1 && paragraphs.length <= maxLines) {
      items = paragraphs;
    } else {
      // Fall back to line-based splitting
      items = lines.filter(line => line.trim());
    }
  }
  
  const totalItems = items.length;
  
  // No pagination needed
  if (totalItems <= maxLines) {
    return {
      text,
      hasMore: false,
      totalItems
    };
  }
  
  // Calculate pagination
  const startIndex = (page - 1) * maxLines;
  const endIndex = startIndex + maxLines;
  const pageItems = items.slice(startIndex, endIndex);
  const hasMore = endIndex < totalItems;
  
  // Generate cache key and store full content
  const cacheKey = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  paginationCache.set(cacheKey, text);
  
  // Build paginated text
  let paginatedText = pageItems.join(isNumberedList || isBulletList ? '' : '\n');
  
  // Add pagination footer
  if (hasMore) {
    const remaining = totalItems - endIndex;
    paginatedText += `\n\n--- Showing ${endIndex} of ${totalItems} items ---\n`;
    paginatedText += `${remaining} more items available. Use show_more with key: ${cacheKey}`;
  }
  
  return {
    text: paginatedText,
    hasMore,
    totalItems,
    cacheKey: hasMore ? cacheKey : undefined
  };
}

/**
 * Get next page from cache
 */
export function getNextPage(cacheKey: string, page: number = 2): PaginationResult {
  const fullText = paginationCache.get(cacheKey);
  if (!fullText) {
    return {
      text: 'Error: Pagination session expired. Please run your search again.',
      hasMore: false,
      totalItems: 0
    };
  }
  
  return paginateText(fullText, 25, page);
}

/**
 * Get full content from cache
 */
export function getFullContent(cacheKey: string): string {
  const fullText = paginationCache.get(cacheKey);
  return fullText || 'Error: Content not found. Please run your search again.';
}

/**
 * Clear old cache entries (called periodically)
 */
export function clearOldCache(maxAgeMs: number = 30 * 60 * 1000): void { // 30 minutes
  const now = Date.now();
  for (const [key] of paginationCache) {
    const timestamp = parseInt(key.split('_')[1]) || 0;
    if (now - timestamp > maxAgeMs) {
      paginationCache.delete(key);
    }
  }
}