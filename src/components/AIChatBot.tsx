"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  User as UserIcon, 
  History, 
  Maximize2, 
  MoreHorizontal,
  Mic,
  MessageSquarePlus,
  Paperclip,
  Smile,
  Search,
  RefreshCcw,
  ChevronDown,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateContent } from "@/app/actions/gemini";
import { toast } from "sonner";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | Timestamp;
}

interface AIChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function AIChatBot({ isOpen, onClose, user }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from Firestore
  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db!, `users/${user.uid}/messages`), 
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to Date for display if needed
        timestamp: doc.data().timestamp?.toDate() || new Date() 
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      console.error("Error loading messages:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue(""); // Clear input immediately

    // If no user or db, use local state (fallback)
    if (!user || !db) {
      const newMessage: Message = { 
        role: 'user', 
        content: content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsLoading(true);
      
      try {
        const result = await generateContent(content);
        if (result.error) {
           // ... handle error locally
           toast.error("Error: " + result.error);
        } else if (result.text) {
           setMessages(prev => [...prev, { 
             role: 'assistant', 
             content: result.text,
             timestamp: new Date()
           }]);
        }
      } catch (err) {
        toast.error("Error de conexión");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // With User: Save to Firestore
    setIsLoading(true);
    try {
      // 1. Add User Message
      await addDoc(collection(db!, `users/${user.uid}/messages`), {
        role: 'user',
        content: content,
        timestamp: serverTimestamp()
      });

      // 2. Call Gemini
      const result = await generateContent(content);

      // 3. Add Assistant Message
      if (result.error) {
        toast.error("Error al obtener respuesta de IA");
        await addDoc(collection(db!, `users/${user.uid}/messages`), {
          role: 'assistant',
          content: "⚠️ Error: " + result.error,
          timestamp: serverTimestamp()
        });
      } else if (result.text) {
        await addDoc(collection(db!, `users/${user.uid}/messages`), {
          role: 'assistant',
          content: result.text,
          timestamp: serverTimestamp()
        });
      }

    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue("");
    setIsLoading(false);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Handle JS Date
    if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-6 p-4 isolate pointer-events-none">
      <div 
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Floating Card - Gali Chat Minimal Style */}
      <div 
        className="relative w-full sm:w-[380px] h-[600px] max-h-[80vh] bg-white shadow-2xl rounded-[30px] flex flex-col animate-in slide-in-from-bottom-10 duration-500 border border-gray-200 pointer-events-auto overflow-hidden font-sans"
      >
        
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100 relative">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center overflow-hidden">
                {/* Simulated Logo */}
                <div className="relative w-full h-full flex items-center justify-center">
                   <div className="absolute w-full h-[1px] bg-blue-400 rotate-45 opacity-50"></div>
                   <div className="absolute w-[80%] h-[80%] border border-blue-400 rounded-full opacity-50 skew-x-12"></div>
                   <Sparkles className="h-5 w-5 text-white relative z-10" />
                </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">LUJAV AI</h3>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <button 
              onClick={handleNewChat}
              className="hover:text-gray-600 transition-colors"
              title="Nuevo Chat"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
            <button 
              onClick={onClose}
              className="hover:text-gray-600 transition-colors"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-0 animate-in fade-in duration-700 fill-mode-forwards" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-bold text-gray-900">
                ¡Hola! ¿Cómo puedo ayudarte?
              </h3>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <div className="grid gap-2 w-full max-w-[240px] mt-8">
                 <button onClick={() => setInputValue("¿Cómo registro un cliente?")} className="text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 px-4 rounded-xl text-left transition-colors">
                    ¿Cómo registro un cliente?
                 </button>
                 <button onClick={() => setInputValue("Ver estadísticas")} className="text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 px-4 rounded-xl text-left transition-colors">
                    Ver estadísticas
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[85%] px-5 py-3 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-black text-white rounded-[24px] rounded-tr-sm' 
                        : 'bg-gray-100 text-gray-800 rounded-[24px] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium">
                     {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col items-start">
                   <div className="bg-gray-100 rounded-[24px] rounded-tl-sm px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 pt-2 bg-white">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe algo..."
              className="w-full bg-gray-50 border-none rounded-full py-4 pl-6 pr-14 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 shadow-sm"
            />
            
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center">
             <span className="text-[11px] font-semibold text-gray-300">
                Powered by LUJAV AI
             </span>
          </div>
        </div>

      </div>
    </div>
  );
}