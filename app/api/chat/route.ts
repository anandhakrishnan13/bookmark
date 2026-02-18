import { google } from '@ai-sdk/google';
//  import { xai } from '@ai-sdk/xai';
import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { fetchSiteContent } from '@/lib/fetchSiteContent';

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

  const result = streamText({
    model:  google('gemini-2.5-flash'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
