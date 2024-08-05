// app/md/[encodedChat]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import pako from 'pako';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Metadata, ResolvingMetadata } from 'next';

interface PageProps {
  params: {
    encodedChat: string;
  };
}

interface Message {
  role: string;
  content: string;
}

async function decodeMessage(encodedChat: string): Promise<Message | null> {
  try {
    const base64 = decodeURIComponent(encodedChat).replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decompressed = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Failed to decode message:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const message = await decodeMessage(params.encodedChat);

  if (!message) {
    return {
      title: 'Shared Message - Not Found',
      description: 'The requested message could not be found.',
    };
  }

  const title = `Shared ${message.role === 'user' ? 'User' : 'Assistant'} Message`;
  const description = message.content.substring(0, 200) + (message.content.length > 200 ? '...' : '');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`],
    },
  };
}

export default async function SharedMessagePage({ params }: PageProps) {
  const message = await decodeMessage(params.encodedChat);

  if (!message) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shared Message</h1>
      <div className="border p-4 rounded-lg">
        <div className="font-semibold mb-2">{message.role === 'user' ? 'User' : 'Assistant'}:</div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}