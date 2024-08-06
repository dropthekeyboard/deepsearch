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
          {description}
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