import { createOpenAI } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, apiKey, context } = body;
  const openai = createOpenAI({
    apiKey
  })

  const [last] = messages.slice(-1);
  const rest = messages.slice(0, -1);
  

  const result = await streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant. intelligently help user finding answer based on given information',
    messages: convertToCoreMessages([...rest, {role:'user', content: `please see following content carefully: ${context}`},last]),
  });

  return result.toAIStreamResponse();
}