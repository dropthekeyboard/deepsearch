import { createOpenAI } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, apiKey, context } = body;
  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
  });
  const together = createOpenAI({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: "https://api.together.xyz/v1"
  })
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const [last] = messages.slice(-1);
  const rest = messages.slice(-5, -1);
  

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are a helpful assistant. intelligently help user finding answer based on given information. use markdown if applicable for better readability',
    messages: convertToCoreMessages([{role:'user', content: `please see following content carefully: ${context}`},...rest,last]),
    maxTokens: 2048,
  });

  return result.toAIStreamResponse();
}