"use client"

import React, { useRef, useLayoutEffect } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Send, Trash2, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import pako from 'pako';
interface ChatUIProps {
  id: string;
  apiKey: string;
  context: string;
}



function ChatUI({id, apiKey, context}:ChatUIProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, handleInputChange, input, handleSubmit, setMessages } = useChat({
    id,
    body: {
      apiKey,
      context,
    }
  });
  
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({
        description: "메시지가 클립보드에 복사되었습니다.",
      });
    }).catch((err) => {
      console.error('클립보드 복사 실패:', err);
      toast({
        variant: "destructive",
        description: "클립보드 복사에 실패했습니다.",
      });
    });
  };

  const clearHistory = () => {
    setMessages([]);
    toast({
      description: "대화 내역이 삭제되었습니다.",
    });
  };

  const compressAndShareMessage = (message: any) => {
    const messageContent = JSON.stringify(message);
    const compressed = pako.deflate(messageContent);
    
    // Convert Uint8Array to regular array
    const compressedArray = Array.from(compressed);
    
    // Process in chunks to avoid "Maximum call stack size exceeded" error
    const chunkSize = 8192;
    let result = '';
    for (let i = 0; i < compressedArray.length; i += chunkSize) {
      result += String.fromCharCode.apply(null, compressedArray.slice(i, i + chunkSize));
    }
    
    // Convert to URL-safe base64
    const base64 = btoa(result);
    const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const shareableLink = `${window.location.origin}/md/${encodeURIComponent(urlSafe)}`;

    navigator.clipboard.writeText(shareableLink).then(() => {
      toast({
        description: "메시지 공유 링크가 클립보드에 복사되었습니다.",
      });
    }).catch((err) => {
      console.error('공유 링크 복사 실패:', err);
      toast({
        variant: "destructive",
        description: "공유 링크 복사에 실패했습니다.",
      });
    });
  };

  return (
    <Card className="w-[50vw] h-[50vh] flex flex-col">
      <CardContent className="flex flex-col h-full p-4">
        <ScrollArea className="flex-grow mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[80%] ${message.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                  <div className={`p-2 border rounded-lg relative group
                    ${message.role === 'user' 
                      ? 'rounded-br-none' 
                      : 'rounded-bl-none'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-1"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => compressAndShareMessage(message)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div 
                    className={`absolute bottom-0 w-2 h-2 overflow-hidden
                      ${message.role === 'user' ? 'right-[-8px]' : 'left-[-8px]'}`}
                  >
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="flex items-center mb-2">
          <form className="flex flex-grow" onSubmit={handleSubmit}>
            <Input
              name='prompt'
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-grow mr-2"
            />
            <Button type='submit'>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={clearHistory}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChatUI;