// app/md/[encodedChat]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import pako from 'pako';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    // Convert from URL-safe base64 back to regular base64
    const base64 = encodedChat.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    const binaryString = atob(paddedBase64);
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