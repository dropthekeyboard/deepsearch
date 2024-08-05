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
            backgroundSize: '150px 150px',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 'bold',
              color: 'black',
              marginBottom: 20,
              width: '100%',
              textAlign: 'center',
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
            maxHeight: '800px', // 내용이 이미지를 벗어나지 않도록 제한
          }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
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