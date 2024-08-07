// app/md/[encodedChat]/page.tsx
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { kv } from "@vercel/kv";
import { SharedContent } from "@prisma/client";
import prisma from "@/lib/prisma"
import cuid2 from '@paralleldrive/cuid2';

interface PageProps {
  params: {
    shareId: string;
  };
}


export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const shared = await kv.get<SharedContent>(params.shareId);

  if (!shared) {
    return {
      title: 'Shared Message - Not Found',
      description: 'The requested message could not be found.',
    };
  }


  const { who, content, view, id } = shared;
  if (view % 2 === 0) {
    await prisma?.sharedContent.upsert({ create: { ...shared, id: cuid2.createId() }, where: { id }, update: { ...shared } });
  }
  await kv.set<SharedContent>(params.shareId, { ...shared, view: view + 1 });
  const description = content.substring(0, 200) + (content.length > 200 ? '...' : '');
  const title = `${who}님이 당신과 정보를 공유합니다`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og/md?who=${encodeURIComponent(who)}&description=${encodeURIComponent(content)}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og/md?who=${encodeURIComponent(who)}&description=${encodeURIComponent(content)}`],
    },
  };
}

export default async function SharedMessagePage({ params }: PageProps) {
  const shared = await kv.get<SharedContent>(params.shareId);

  if (!shared) {
    notFound();
  }
  const { content, who, view } = shared;

  return (
    <div className="container mx-auto p-4">
      <div className="text-2xl font-bold mb-4">{`Shared By ${who}`}</div>
      <div className="border p-4 rounded-lg">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}