"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Sparkles, Brain, ChevronDown, ChevronRight, Copy, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thought?: string;
  timestamp: Date;
  metrics?: {
    ttft: number; // ms
    speed: number; // tokens/s
    totalTime: number; // ms
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const startTime = Date.now();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          isThinkingEnabled
        })
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      const fullContent = data.content || "";
      
      // Parse thinking block
      let thought = undefined;
      let finalContent = fullContent;

      const thinkingMatch = fullContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        thought = thinkingMatch[1].trim();
        finalContent = fullContent.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim();
      }

      // Simulate metrics for display purposes
      // TTFT is usually < totalTime. Let's approximate.
      const ttft = Math.floor(totalTime * 0.2); 
      // Speed (tokens/sec) = length / (totalTime/1000) * factor
      const speed = (finalContent.length / 4) / (totalTime / 1000); 

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: finalContent || "Lo siento, hubo un error al procesar tu respuesta.",
        thought: thought,
        metrics: {
          ttft,
          speed: parseFloat(speed.toFixed(2)),
          totalTime
        },
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error fetching chat response:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Error: ${error.message || "Disculpa, estoy teniendo problemas para conectar con el servidor en este momento. Por favor intenta de nuevo."}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Chat Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {messages.length === 0 ? (
          // Empty State / Hero
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <Bot className="h-8 w-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              Asistente Lujav
            </h1>
            <p className="text-gray-500 max-w-md mb-8">
              Consulta cotizaciones, estados de envío y resuelve tus dudas operativas con nuestra IA avanzada.
            </p>
          </div>
        ) : (
          // Messages List
          <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollAreaRef}>
            <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 w-full ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-8 h-8 mt-1 border border-gray-100 shrink-0">
                      <div className="w-full h-full bg-black text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                    
                    {/* User Message Bubble */}
                    {message.role === "user" && (
                       <div className="px-4 py-3 bg-gray-100 text-gray-900 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                       </div>
                    )}

                    {/* Assistant Message Block */}
                    {message.role === "assistant" && (
                      <div className="w-full space-y-2">
                        {/* Thinking Block */}
                        {message.thought && (
                          <ThinkingBlock thought={message.thought} duration={message.metrics?.totalTime} />
                        )}
                        
                        {/* Main Content with Markdown */}
                        <div className="text-gray-800 text-sm leading-relaxed markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                            strong: ({node, ...props}) => <span className="font-semibold text-gray-900" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                          }}>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Footer Metrics */}
                        <div className="flex items-center gap-4 mt-2 pt-2 text-xs text-gray-400 font-mono select-none">
                           <div className="flex items-center gap-2">
                              <button onClick={() => copyToClipboard(message.content)} className="hover:text-gray-600 transition-colors" title="Copiar">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button className="hover:text-gray-600 transition-colors" title="Regenerar">
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                           </div>
                           
                           {message.metrics && (
                             <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
                                <span title="Time To First Token">TTFT: {message.metrics.ttft}ms</span>
                                <span title="Generation Speed">SPEED: {message.metrics.speed} tokens/s</span>
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <Avatar className="w-8 h-8 mt-1 border border-gray-100 shrink-0">
                      <div className="w-full h-full bg-gray-100 text-gray-600 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 w-full justify-start">
                   <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-4 flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white shrink-0 flex justify-center">
        <div className="w-full max-w-3xl relative rounded-2xl border border-gray-200 shadow-sm bg-white overflow-hidden focus-within:ring-1 focus-within:ring-gray-300 transition-all">
          <textarea 
            className="w-full resize-none border-0 bg-transparent p-4 text-base focus:outline-none min-h-[60px] max-h-[200px] placeholder:text-gray-400"
            placeholder="Di algo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <Button 
              variant="outline" 
              size="sm" 
              className={`gap-2 rounded-full text-xs font-medium h-8 border shadow-none transition-colors ${
                isThinkingEnabled 
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800' 
                  : 'text-gray-500 hover:text-gray-700 bg-transparent border-transparent hover:bg-gray-100'
              }`}
              onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
            >
              <Brain className="h-3.5 w-3.5" />
              {isThinkingEnabled ? 'Thinking Enabled' : 'Enable Thinking'}
            </Button>
            
            <Button 
              size="icon"
              className={`h-8 w-8 rounded-lg transition-all ${
                input.trim() 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThinkingBlock({ thought, duration }: { thought: string, duration?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Format duration to seconds (e.g. "2 seconds" or "1.5 seconds")
  const seconds = duration ? (duration / 1000).toFixed(1).replace(/\.0$/, '') : "some";

  return (
    <div className="mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors select-none"
      >
        <div className={`w-4 h-4 flex items-center justify-center transition-transform ${isOpen ? 'rotate-90' : ''}`}>
           <ChevronRight className="h-3 w-3" />
        </div>
        <Brain className="h-3 w-3" />
        <span>Thought for {seconds} seconds</span>
      </button>
      
      {isOpen && (
        <div className="mt-2 ml-2 pl-3 border-l-2 border-gray-100 text-sm text-gray-500 italic leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
          {thought}
        </div>
      )}
    </div>
  );
}
