"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "ai/react";
import { Send, Copy, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { useToast } from '@/components/ui/use-toast';
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

  return (
    <Card className="w-[50vw] h-[50vh] flex flex-col">
      <CardContent className="flex flex-col h-full p-4">
        <ScrollArea className="flex-grow mb-4 ">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <Card className={`inline-block p-2 ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'} relative group`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(message.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Card>
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