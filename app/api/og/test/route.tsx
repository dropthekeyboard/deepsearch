import { ImageResponse } from '@vercel/og';
import { Converter } from "showdown";
import { Parser } from "html-to-react";
import { SharedContent } from "@prisma/client";
import React, { ReactNode, CSSProperties } from 'react';
import Image from 'next/image';
import { kv } from '@vercel/kv';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';

export const runtime = "edge"

const converter = new Converter({ tables: true, tablesHeaderId: true, emoji: true, ghCodeBlocks:true });
const parser = Parser();


const commonStyles: CSSProperties = {
  margin: '5px 0',
  display: 'flex',
  flexDirection: 'column',
};

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url);
  
  const content = `다음은 미국 소재의 매우 초기에 주목할 만한 AI 스타트업 목록입니다:

1. **Aragon AI**
   - **설립 연도**: 2024
   - **설명**: 생성적 AI 기술을 활용하여 사람들의 문제를 해결하는 솔루션을 제공하는 스타트업. Y Combinator에 합격하여 주목받고 있음.
   - **링크**: [Yahoo News](https://ca.news.yahoo.com/im-generative-ai-startup-founder-100001815.html)

2. **HelloGov**
   - **설립 연도**: 2024
   - **설명**: 정부 문서(비자 등) 신청 과정을 간소화하고 신속하게 처리하는 AI 기반 스타트업. 사용자 친화적인 접근 방식을 통해 신청자의 승인 가능성을 높임.
   - **링크**: [Business Insider](https://africa.businessinsider.com/local/lifestyle/how-this-ai-startup-is-making-it-easier-to-visit-liveand-work-in-the-united-states/j0wtgsm)

3. **Memorable AI**
   - **설립 연도**: 2021
   - **설명**: 마케팅 광고의 효과를 높이기 위해 생성적 AI를 사용하는 스타트업. Reddit에 인수됨.
   - **링크**: [Bloomberg Law](https://news.bloomberglaw.com/artificial-intelligence/reddit-acquires-generative-ai-startup-memorable-ai)

4. **Leonardo.ai**
   - **설립 연도**: 2022
   - **설명**: AI 기반 이미지 생성 스타트업으로, Canva에 인수됨. 다양한 디자인 도구를 제공.
   - **링크**: [TechPoint](https://techpoint.africa/2024/07/30/canva-acquires-leonardo-ai/)

이 스타트업들은 각각의 독특한 접근 방식과 혁신적인 기술로 주목받고 있으며, AI 분야에서의 성장을 기대할 수 있습니다.`;

  console.log("content : ", content);
  try {
    const title: string = `👋 ${'david'}님이 Assistant와 대화를 공유합니다.`;
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
              fontSize:'10px',
              borderRadius: '15px',
              padding: '15px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '780px',
              minHeight: '200px',
              maxHeight: '500px',
              overflowY: 'auto',
            }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
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