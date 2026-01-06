"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Search, 
  ChevronDown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Video, 
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  History,
  Maximize2,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import AIChatBot from "./AIChatBot";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  
  // AI State
  const [isIAOpen, setIsIAOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-10 relative">
        
        {/* Left: Workspace Selector (MetaWeb Dev Solutions Style) */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/80 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
            <div className="w-5 h-5 bg-teal-500 rounded text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              L
            </div>
            <span className="text-sm font-semibold text-gray-700">Transportes Lujav Workspace</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 ml-1" />
          </div>
          
          {/* Status Icons */}
          <div className="flex items-center gap-3 ml-4 border-l border-gray-200 pl-4">
             <button 
                onClick={() => setIsIAOpen(true)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${isIAOpen ? 'bg-red-50 text-red-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
             >
                <Sparkles className={`h-4 w-4 ${isIAOpen ? 'text-red-600' : 'text-purple-600'}`} />
                <span className={`text-sm font-medium ${isIAOpen ? 'text-red-700' : 'text-gray-600'}`}>IA</span>
             </button>
             <button className="text-gray-400 hover:text-gray-600">
                <Calendar className="h-4 w-4" />
             </button>
             <button className="text-gray-400 hover:text-amber-500">
                <AlertTriangle className="h-4 w-4" />
             </button>
          </div>
        </div>

        {/* Right: Search & User Profile */}
        <div className="flex items-center gap-4">
          
          {/* Quick Actions (Check, Clock, Video) */}
          <div className="flex items-center gap-3 mr-2">
             <button className="text-gray-400 hover:text-green-600">
                <CheckCircle2 className="h-4 w-4" />
             </button>
             <button className="text-gray-400 hover:text-blue-600">
                <Clock className="h-4 w-4" />
             </button>
             <button className="text-gray-400 hover:text-purple-600">
                <Video className="h-4 w-4" />
             </button>
          </div>

          {/* User Avatar with Dropdown */}
          <div className="flex items-center gap-1 cursor-pointer">
             <div className="relative">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User Profile" 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                     {user?.email?.substring(0, 2).toUpperCase() || "TL"}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>

          {/* Search Bar (Pill Shape) */}
          <div className="relative group w-64 hidden sm:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-gray-600" />
             <input 
               type="text" 
               placeholder="Buscar" 
               className="w-full pl-9 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] text-gray-400 mr-1">Ctrl K</span>
                <div className="w-4 h-4 flex items-center justify-center">
                   {/* Colorful icon/sparkle placeholder */}
                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-purple-500">
                     <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                   </svg>
                </div>
             </div>
          </div>

        </div>
      </header>

      <AIChatBot isOpen={isIAOpen} onClose={() => setIsIAOpen(false)} user={user} />
    </>
  );
}
