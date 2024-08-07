import { ImageResponse } from '@vercel/og';
import { Converter } from "showdown";
import { Parser } from "html-to-react";
import React, { ReactNode, CSSProperties } from 'react';
import Image from 'next/image';

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
  const who = 'davidlee';
  const content = `아래는 OpenAI와 관련된 주요 리스크를 출처와 함께 테이블로 정리한 것입니다.

| 리스크               | 설명                                                                                     | 출처                                                                                     |
|---------------------|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| 재정적 손실          | OpenAI는 최근 몇 년 동안 막대한 자금을 투자받았지만, 여전히 수익을 창출하지 못하고 있으며, 이는 재정적 지속 가능성에 대한 우려를 낳고 있습니다. | [Fortune](https://fortune.com/2024/08/02/google-character-ai-founders-microsoft-inflection-amazon-adept/) |
| 경쟁 심화            | AI 분야에서의 경쟁이 치열해지고 있으며, 대형 기술 기업들이 AI 스타트업을 인수하거나 인재를 영입하는 경향이 있습니다. | [Fortune](https://fortune.com/2024/08/02/google-character-ai-founders-microsoft-inflection-amazon-adept/) |
| 규제 및 법적 문제    | AI 기술의 발전과 함께 규제 기관의 감시가 강화되고 있으며, OpenAI는 데이터 사용 및 개인정보 보호와 관련된 법적 문제에 직면할 수 있습니다. | [Ars Technica](https://arstechnica.com/tech-policy/2024/08/us-probes-nvidias-acquisition-of-israeli-ai-startup/) |
| 기술적 한계          | OpenAI의 모델이 인공지능의 일반화된 지능(AGI)에 도달하는 데 필요한 기술적 진전을 이루지 못할 경우, 시장에서의 경쟁력에 부정적인 영향을 미칠 수 있습니다. | [Fortune](https://fortune.com/2024/08/02/google-character-ai-founders-microsoft-inflection-amazon-adept/) |
| 사회적 비판          | OpenAI의 기술이 잘못 사용되거나 부적절한 결과를 초래할 경우, 사회적 비판과 반발을 받을 수 있습니다. | [Fortune](https://fortune.com/2024/08/02/google-character-ai-founders-microsoft-inflection-amazon-adept/) |

이 테이블은 OpenAI와 관련된 리스크를 요약하여 보여줍니다. 각 리스크에 대한 설명과 함께 출처를 명시하였습니다.`;
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