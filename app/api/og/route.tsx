import { ImageResponse } from '@vercel/og';
import { CSSProperties } from 'react';

export const runtime = "edge"

type ParsedElement = {
  type: 'text' | 'table' | 'list';
  content: string | string[][] | string[];
  style: CSSProperties;
};

function isTableSeparator(cells: string[]): boolean {
  return cells.every(cell => /^:?-+:?$/.test(cell.trim()) || cell.trim() === '-');
}

function replaceLinksWithEmoji(text: string): string {
  // Replace markdown links with a link emoji
  return text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '🔗 $1');
}

function parseMarkdown(markdown: string): ParsedElement[] {
  const lines = markdown.split('\n');
  const elements: ParsedElement[] = [];
  let currentTable: string[][] = [];
  let currentList: string[] = [];
  let isInTable = false;
  let isInList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = replaceLinksWithEmoji(lines[i].trim());

    if (line.startsWith('|') && line.endsWith('|') && line.includes('|', 1)) {
      // Potential table row
      if (isInList) {
        elements.push({ type: 'list', content: currentList, style: { fontSize: '16px', marginBottom: '8px' } });
        currentList = [];
        isInList = false;
      }

      const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
      
      if (!isInTable) {
        isInTable = true;
        currentTable.push(cells);
      } else if (isTableSeparator(cells) && currentTable.length === 1) {
        continue;
      } else {
        currentTable.push(cells);
      }

      if (i === lines.length - 1 || !lines[i + 1].trim().startsWith('|')) {
        elements.push({
          type: 'table',
          content: currentTable,
          style: { fontSize: '14px', width: '100%' }
        });
        currentTable = [];
        isInTable = false;
      }
    } else if (line.startsWith('- ')) {
      if (isInTable) {
        elements.push({
          type: 'table',
          content: currentTable,
          style: { fontSize: '14px', width: '100%' }
        });
        currentTable = [];
        isInTable = false;
      }
      isInList = true;
      currentList.push(line.slice(2));
    } else {
      if (isInTable) {
        elements.push({
          type: 'table',
          content: currentTable,
          style: { fontSize: '14px', width: '100%' }
        });
        currentTable = [];
        isInTable = false;
      }
      if (isInList) {
        elements.push({ type: 'list', content: currentList, style: { fontSize: '16px', marginBottom: '8px' } });
        currentList = [];
        isInList = false;
      }

      let style: CSSProperties = { fontSize: '16px', marginBottom: '8px' };
      let text = line;

      if (line.startsWith('# ')) {
        text = line.slice(2);
        style = { fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' };
      } else if (line.startsWith('## ')) {
        text = line.slice(3);
        style = { fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' };
      }

      if (text.includes('**')) {
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');
        style.fontWeight = 'bold';
      }
      if (text.includes('*')) {
        text = text.replace(/\*(.*?)\*/g, '$1');
        style.fontStyle = 'italic';
      }

      elements.push({ type: 'text', content: text, style });
    }
  }

  if (isInList) {
    elements.push({ type: 'list', content: currentList, style: { fontSize: '16px', marginBottom: '8px' } });
  }

  return elements;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title')?.slice(0, 100) || 'Shared Assistant Message';
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
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            backgroundColor: '#f0f0f0',
            padding: '40px',
          }}
        >
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px', width: '100%', textAlign: 'center' }}>{title}</div>
          {parsedElements.map((element, index) => {
            if (element.type === 'text') {
              return (
                <div key={index} style={{ ...element.style, width: '100%', display: 'flex' }}>
                  {element.content as string}
                </div>
              );
            } else if (element.type === 'table') {
              const tableContent = element.content as string[][];
              const maxColumns = Math.max(...tableContent.map(row => row.length));
              return (
                <div key={index} style={{ width: '100%', display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                  {tableContent.map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex', width: '100%' }}>
                      {Array.from({ length: maxColumns }).map((_, cellIndex) => (
                        <div key={cellIndex} style={{
                          flex: 1,
                          border: '1px solid #ddd',
                          padding: '8px',
                          backgroundColor: rowIndex === 0 ? '#e0e0e0' : '#fff',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: '20px',
                        }}>
                          {row[cellIndex] || ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            } else if (element.type === 'list') {
              return (
                <div key={index} style={{ width: '100%', display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                  {(element.content as string[]).map((item, itemIndex) => (
                    <div key={itemIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ marginRight: '8px', fontSize: '16px' }}>•</div>
                      <div style={{ fontSize: '16px' }}>{item}</div>
                    </div>
                  ))}
                </div>
              );
            }
          })}
        </div>
      ),
      {
        width: 800,
        height: 1200,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}