import { ImageResponse } from '@vercel/og';
import { Converter } from "showdown";
import { Parser } from "html-to-react";
import { SharedContent } from "@prisma/client";
import React, { ReactNode, CSSProperties } from 'react';
import Image from 'next/image';
import { kv } from '@vercel/kv';

export const runtime = "edge"
export const dynamic = "force-dynamic";
const converter = new Converter({ tables: true, tablesHeaderId: true, emoji: true, ghCodeBlocks:true });
const parser = Parser();


const commonStyles: CSSProperties = {
  margin: '5px 0',
  display: 'flex',
  flexDirection: 'column',
};

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url);
  const id = searchParams.get("id");

  if(!id) {
    throw new Error("id must be specified");
  }
  const item = await kv.get<SharedContent>(id);
  if(!item) {
    throw new Error(`invalid content for ${id}`);
  }
  const {who, content} = item;
  console.log("content : ", content);
  try {
    const title: string = `👋 ${who}님이 Assistant와 대화를 공유합니다.`;
    const htmlContent: string = converter.makeHtml(content||'');
    const reactContent: ReactNode = parser.parse(htmlContent);

    const FallbackContent = () => (
      <div style={{
        padding: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '5px',
        marginTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
      }}>
        죄송합니다. 콘텐츠를 불러오는 데 문제가 발생했습니다. 나중에 다시 시도해 주세요.
      </div>
    );

    const renderContent = (content: ReactNode): ReactNode => {
      if (typeof content === 'string') {
        return <div style={{ ...commonStyles, flexDirection: 'row', fontSize: '12px' }}>{content}</div>;
      }

      if (!React.isValidElement(content)) {
        return null;
      }

      const elementType = content.type;
      if (typeof elementType === 'string') {
        if (elementType === 'table') {
          return (
            <div style={{
              ...commonStyles,
              width: '100%',
              fontSize: '10px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              {React.Children.map(content.props.children, (tableChild: ReactNode, tableIndex: number) => {
                if (!React.isValidElement(tableChild)) return null;
                
                const childType = tableChild.type;
                if (typeof childType !== 'string') return null;

                if (childType === 'thead') {
                  return (
                    <div key={tableIndex} style={{
                      ...commonStyles,
                      backgroundColor: '#4a4a4a',
                      color: 'white',
                    }}>
                      {React.Children.map(tableChild.props.children, (headRow: ReactNode, headRowIndex: number) => {
                        if (!React.isValidElement(headRow)) return null;

                        return (
                          <div key={headRowIndex} style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            minHeight: '20px',
                            maxHeight: '30px',
                          }}>
                            {React.Children.map(headRow.props.children, (headCell: ReactNode, headCellIndex: number) => {
                              if (!React.isValidElement(headCell)) return null;

                              return (
                                <div key={headCellIndex} style={{
                                  padding: '4px',
                                  textAlign: 'left',
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  minWidth: '60px',
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {headCell.props.children}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (childType === 'tbody') {
                  return (
                    <div key={tableIndex} style={commonStyles}>
                      {React.Children.map(tableChild.props.children, (row: ReactNode, rowIndex: number) => {
                        if (!React.isValidElement(row)) return null;

                        return (
                          <div key={rowIndex} style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #ddd',
                            minHeight: '40px',
                            maxHeight: '50px',
                          }}>
                            {React.Children.map(row.props.children, (cell: ReactNode, cellIndex: number) => {
                              if (!React.isValidElement(cell)) return null;

                              return (
                                <div key={cellIndex} style={{
                                  padding: '4px',
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  minWidth: '60px',
                                  maxWidth: '200px',
                                  overflow: 'hidden',
                                }}>
                                  <div style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'flex',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}>
                                    {cell.props.children}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          );
        }

        // 다른 HTML 요소들 처리
        const validElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'];
        if (validElements.includes(elementType)) {
          const style = {
            ...commonStyles,
            fontSize: elementType.startsWith('h') ? `${18 - parseInt(elementType.slice(1))}px` : '12px',
            fontWeight: elementType.startsWith('h') ? 'bold' : 'normal',
          };
          return React.createElement(
            'div',
            { style: { ...style, display: 'flex' } },
            React.Children.map(content.props.children, child => renderContent(child))
          );
        }
      }

      return null;
    };

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f0f0f0',
          padding: '10px',
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '15px',
              textAlign: 'center',
              display: 'flex',
            }}>
              {title}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '15px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '780px',
              minHeight: '200px',
              maxHeight: '500px',
              overflowY: 'auto',
            }}>
              {React.Children.map(reactContent, (child, index) => renderContent(child))}
              {!React.Children.count(reactContent) && <FallbackContent />}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '10px',
            fontSize: '12px',
            color: '#666',
          }}>
            <Image src={`/favicon.ico`} alt="Deep Search Logo" width="20" height="20" style={{ marginRight: '5px' }} />
            Powered by Deep Search
          </div>
        </div>
      ),
      {
        width: 800,
        height: 600,
        emoji: 'openmoji',
      }
    );
  } catch (e: any) {
    console.error(`Error generating OG image: ${e.message}`);
    console.error(e.stack);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}