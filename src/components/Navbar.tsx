"use client";

import { useEffect, useState } from "react";
import { 
  ChevronDown, 
  AlertTriangle, 
  Briefcase,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Workspace {
  id: string;
  name: string;
  base: string;
}

interface NavbarUser {
  uid: string;
  email: string | null;
  photoURL: string | null;
  displayName: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<NavbarUser | null>(null);
  
  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const initNavbar = async () => {
      if (!supabase) {
        console.error("Supabase client not initialized");
        return;
      }

      // 1. Get Auth User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // 2. Get Profile Info
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        setUser({
          uid: authUser.id,
          email: authUser.email || "",
          photoURL: profile?.avatar_url || null,
          displayName: profile?.full_name || authUser.email?.split('@')[0] || "Usuario"
        });

        // 3. Fetch Workspaces
        try {
          const { data, error } = await supabase
            .from('workspaces')
            .select('id, name, base');
          
          if (error) {
            // Manejo silencioso: si falla (ej. permisos RLS), asumimos lista vacía
            setWorkspaces([]);
            setCurrentWorkspace(null);
            return;
          }

          const wsData = data as Workspace[];

          if (wsData && wsData.length > 0) {
            setWorkspaces(wsData);
            // Set default workspace
            setCurrentWorkspace(wsData[0]);
          } else {
            setWorkspaces([]);
            setCurrentWorkspace(null);
          }
        } catch (error) {
          console.error("Error in fetchWorkspaces:", error);
        }
      }
    };

    initNavbar();
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-10 relative">
      
      {/* Left: Workspace Selector */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/80 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
              <div className="w-5 h-5 bg-teal-500 rounded text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {currentWorkspace?.name.charAt(0).toUpperCase() || "L"}
              </div>
              <span className="text-sm font-semibold text-gray-700 max-w-[150px] truncate">
                {currentWorkspace?.name || "Sin Workspace"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Mis Workspaces</DropdownMenuLabel>
            {workspaces.length > 0 ? (
              workspaces.map(ws => (
                <DropdownMenuItem key={ws.id} onClick={() => setCurrentWorkspace(ws)}>
                  <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{ws.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{ws.base}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-2 text-xs text-gray-500 text-center">
                No tienes workspaces asignados
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Status Icons */}
        <div className="flex items-center gap-3 ml-4 border-l border-gray-200 pl-4">
             <button 
               className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-xs font-medium transition-colors"
               onClick={() => window.open("/dashboard/chat", "_blank")}
             >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
             </button>
           <button className="text-gray-400 hover:text-amber-500">
              <AlertTriangle className="h-4 w-4" />
           </button>
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-4">
        
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
                   {user?.displayName?.substring(0, 2).toUpperCase() || "TL"}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
           </div>
           <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>

      </div>
    </header>
  );
}
