'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useChatStore } from '@/lib/store/chatStore';
import { pdfService } from '@/lib/services/pdfService';
import { chatService } from '@/lib/services/chatService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, Loader2, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const pdfId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { messages, addMessage, setIsLoading, isLoading, sessionId, setSessionId } = useChatStore();

  const [pdf, setPdf] = useState<any>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadPDF();
  }, [isAuthenticated, pdfId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPDF = async () => {
    try {
      const response = await pdfService.getById(pdfId);
      setPdf(response.data.pdf);

      if (response.data.pdf.processingStatus !== 'completed') {
        toast.error('PDF is still processing. Please wait.');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to load PDF');
      router.push('/dashboard');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(pdfId, {
        message: input,
        sessionId: sessionId || undefined,
      });

      if (!sessionId) {
        setSessionId(response.data.sessionId);
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.data.answer,
        timestamp: new Date().toISOString(),
        context: response.data.context,
      };

      addMessage(assistantMessage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{pdf?.filename || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground">{pdf?.pageCount && `${pdf.pageCount} pages`}</p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground">Ask questions about your document and get instant answers</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <Card
                    className={`max-w-[80%] ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div className="p-4">
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}

                      {message.context && message.context.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs font-medium mb-2">Sources:</p>
                          <div className="space-y-1">
                            {message.context.map((ctx, idx) => (
                              <p key={idx} className="text-xs opacity-75">
                                Page {ctx.pageNumber} (relevance: {(ctx.score * 100).toFixed(0)}%)
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-muted">
                    <div className="p-4 flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex space-x-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your document..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
