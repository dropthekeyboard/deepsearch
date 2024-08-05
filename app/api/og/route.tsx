import { ImageResponse } from '@vercel/og';
import { CSSProperties } from 'react';

export const runtime = "edge"

type ParsedElement = {
  type: 'text' | 'table';
  content: string | string[][];
  style: CSSProperties;
};

function parseMarkdown(markdown: string): ParsedElement[] {
  const lines = markdown.split('\n');
  const elements: ParsedElement[] = [];
  let currentTable: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('|')) {
      // Table row
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      currentTable.push(cells);

      // Check if it's the end of the table
      if (i === lines.length - 1 || !lines[i + 1].includes('|')) {
        elements.push({
          type: 'table',
          content: currentTable,
          style: { fontSize: '14px', borderCollapse: 'collapse' as const }
        });
        currentTable = [];
      }
    } else {
      if (currentTable.length > 0) {
        elements.push({
          type: 'table',
          content: currentTable,
          style: { fontSize: '14px', borderCollapse: 'collapse' as const }
        });
        currentTable = [];
      }

      let style: CSSProperties = { fontSize: '16px' };
      let text = line;

      if (line.startsWith('# ')) {
        text = line.slice(2);
        style = { fontSize: '24px', fontWeight: 'bold' };
      } else if (line.startsWith('## ')) {
        text = line.slice(3);
        style = { fontSize: '20px', fontWeight: 'bold' };
      } else if (line.startsWith('- ')) {
        text = '• ' + line.slice(2);
      }

      if (text.includes('**')) {
        text = text.replace(/\*\*/g, '');
        style.fontWeight = 'bold';
      }
      if (text.includes('*')) {
        text = text.replace(/\*/g, '');
        style.fontStyle = 'italic';
      }

      elements.push({ type: 'text', content: text, style });
    }
  }

  return elements;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title')?.slice(0, 100) || 'Shared Message';
    const description = searchParams.get('description') || 'A message shared from our chat application.';

    const parsedElements = parseMarkdown(description);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: '#fff',
            padding: '40px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>{title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '90%', gap: '10px' }}>
            {parsedElements.map((element, index) => {
              if (element.type === 'text') {
                return <div key={index} style={element.style}>{element.content as string}</div>;
              } else if (element.type === 'table') {
                const tableContent = element.content as string[][];
                return (
                  <table key={index} style={element.style}>
                    <tbody>
                      {tableContent.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              }
            })}
          </div>
        </div>
      ),
      {
        width: 800,
        height: 400,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}