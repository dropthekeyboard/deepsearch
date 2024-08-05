// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og';
import { marked } from 'marked';

export const runtime = "edge"

// HTML을 간단한 React 요소로 변환하는 함수
function htmlToReact(html: string): React.ReactNode {
  const lines = html.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('<h1>')) {
      return <h1 key={index} style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>{line.replace(/<\/?h1>/g, '')}</h1>;
    } else if (line.startsWith('<h2>')) {
      return <h2 key={index} style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>{line.replace(/<\/?h2>/g, '')}</h2>;
    } else if (line.startsWith('<p>')) {
      return <p key={index} style={{ fontSize: 20, marginBottom: 6 }}>{line.replace(/<\/?p>/g, '')}</p>;
    } else if (line.startsWith('<li>')) {
      return <li key={index} style={{ fontSize: 20, marginBottom: 6, marginLeft: 20 }}>{line.replace(/<\/?li>/g, '')}</li>;
    } else if (line.startsWith('<table>')) {
      return <p key={index} style={{ fontSize: 18, marginBottom: 6, fontStyle: 'italic' }}>Table: (표 내용은 이미지에 표시되지 않습니다)</p>;
    }
    return null;
  }).filter(Boolean);
}

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

    // Markdown을 HTML로 변환
    const htmlContent = await marked(description || '');
    
    // HTML을 React 요소로 변환
    const contentElements = htmlToReact(htmlContent);

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
            {contentElements}
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