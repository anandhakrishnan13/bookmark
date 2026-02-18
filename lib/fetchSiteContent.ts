// Server-side utility: fetches website content via Jina AI Reader
// Returns clean markdown text suitable for LLM context

const contentCache = new Map<string, { content: string; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CONTENT_LENGTH = 15_000; // ~15k chars to stay within context limits

export async function fetchSiteContent(url: string): Promise<string> {
  // Check cache first
  const cached = contentCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.content;
  }

  const jinaUrl = `https://r.jina.ai/${url}`;

  const response = await fetch(jinaUrl, {
    method: 'GET',
    headers: {
      Accept: 'text/markdown',
      'X-Return-Format': 'markdown',
    },
    signal: AbortSignal.timeout(15_000), // 15s timeout
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch site content: ${response.status} ${response.statusText}`
    );
  }

  let content = await response.text();

  // Truncate if too long
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated]';
  }

  // Cache the result
  contentCache.set(url, { content, fetchedAt: Date.now() });

  return content;
}
