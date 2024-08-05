// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const runtime = "edge"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const hasTitle = searchParams.has('title');
    const hasDescription = searchParams.has('description');

    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'Shared Message';
    const description = hasDescription
      ? searchParams.get('description')
      : 'A message shared from our chat application.';

    return new ImageResponse(
      (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
        >
          {description}
        </ReactMarkdown>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}