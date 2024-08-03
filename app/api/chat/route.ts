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
  const openai = createOpenAI({
    apiKey
  })

  const [last] = messages.slice(-1);
  const rest = messages.slice(-5, -1);
  

  const result = await streamText({
    model: apiKey? openai('gpt-4o-mini') : groq('llama-3.1-8b-instant'),
    system: 'You are a helpful assistant. intelligently help user finding answer based on given information. use markdown if applicable for better readability',
    messages: convertToCoreMessages([...rest, {role:'user', content: `please see following content carefully: ${context}`},last]),
    maxTokens: 1024,
    frequencyPenalty: 0.2
  });

  return result.toAIStreamResponse();
}