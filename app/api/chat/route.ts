import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, smoothStream, type UIMessage, convertToModelMessages } from 'ai';
import { fetchSiteContent } from '@/lib/fetchSiteContent';


function getApiKeys(): string[] {
  const value = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!value) return [];
  return value.split(',').map((k) => k.trim()).filter(Boolean);
}

const API_KEYS = getApiKeys();
let currentKeyIndex = 0;

function getNextKey(): string | null {
  if (API_KEYS.length === 0) return null;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return API_KEYS[currentKeyIndex] ?? null;
}

function getCurrentKey(): string | null {
  if (API_KEYS.length === 0) return null;
  return API_KEYS[currentKeyIndex] ?? null;
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource has been exhausted') ||
    msg.includes('429') ||
    msg.includes('too many requests')
  );
}

function createModel(apiKey: string) {
  const provider = createGoogleGenerativeAI({ apiKey });
  return provider('gemini-2.5-flash');
}

async function tryStreamText(apiKey: string, systemPrompt: string, messages: UIMessage[]) {
  const result = streamText({
    model: createModel(apiKey),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    experimental_transform: smoothStream({ chunking: 'word' }),
    maxRetries: 0, // No retries — single attempt per key
  });
  return result;
}

export async function POST(req: Request) {
  const {
    messages,
    siteUrl,
  }: { messages: UIMessage[]; siteUrl: string } = await req.json();

  if (!siteUrl) {
    return new Response(JSON.stringify({ error: 'No site URL provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = getCurrentKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI service is not configured. Please add a Gemini API key.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch website content via Jina Reader (cached)
  let siteContent: string;
  try {
    siteContent = await fetchSiteContent(siteUrl);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to read the website. It may be inaccessible or blocking scrapers.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const systemPrompt = `You are a helpful AI assistant for the Smart Bookmarks app. The user has selected a specific bookmarked website to chat about.

Your role:
- ONLY answer questions about the website content provided below
- If the user asks about something unrelated to this website, politely decline and redirect them to ask about the website
- Be concise and helpful
- Quote relevant sections when appropriate
- If the content doesn't contain enough information to answer, say so honestly

Website URL: ${siteUrl}

Website Content:
---
${siteContent}
---

Remember: Only discuss this specific website. Do not make up information not found in the content above.`;

  // Attempt with current key
  try {
    const result = await tryStreamText(apiKey, systemPrompt, messages);
    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    // If it's a quota error and we have more keys, try the next one
    if (isQuotaError(error) && API_KEYS.length > 1) {
      const nextKey = getNextKey();
      if (nextKey && nextKey !== apiKey) {
        try {
          const result = await tryStreamText(nextKey, systemPrompt, messages);
          return result.toUIMessageStreamResponse();
        } catch (retryError: unknown) {
          if (isQuotaError(retryError)) {
            return new Response(
              JSON.stringify({ error: 'QUOTA_EXCEEDED' }),
              { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
          }
          return new Response(
            JSON.stringify({ error: 'Failed to get a response from AI. Please try again.' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      // Only one unique key or rotation brought us back to same key
      return new Response(
        JSON.stringify({ error: 'QUOTA_EXCEEDED' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Quota error with single key
    if (isQuotaError(error)) {
      return new Response(
        JSON.stringify({ error: 'QUOTA_EXCEEDED' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic AI failure
    return new Response(
      JSON.stringify({ error: 'Failed to get a response from AI. Please try again.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
