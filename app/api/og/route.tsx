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
        <div
          style={{
            backgroundColor: 'white',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: 'black',
              marginBottom: 10,
              width: '100%',
              textAlign: 'left',
            }}
          >
            {title}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            overflowY: 'hidden',
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
            >
              {description}
            </ReactMarkdown>
          </div>
        </div>
      ),
      {
        width: 600,
        height: 960,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}