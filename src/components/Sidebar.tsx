"use client";

import { useEffect, useState } from "react";
import { 
  Home, 
  Users, 
  FileText, 
  LogOut,
  Calculator,
  Tags,
  Shield,
  UserPlus,
  ArrowUpCircle,
  Briefcase,
  MessageSquare
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // TODO: Implement actual admin check logic here
  const isAdmin = true; 
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!supabase) return;
      try {
        const { count, error } = await supabase
          .from('cotizaciones')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');
        
        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch (error) {
        console.error("Error fetching pending count:", error);
      }
    };

    fetchPendingCount();
    
    // Optional: Realtime subscription could go here
  }, []);

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      // Firebase auth sign out removed
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      router.push("/login");
    }
  };

  if (!pathname) return null;

  return (
    <div className="fixed top-0 left-0 h-full w-[72px] z-50">
      {/* 1. Slim Icon Rail (Leftmost) - Updated to match the dark visual style with labels below */}
      <div className="w-full bg-red-700 flex flex-col items-center py-4 gap-2 shrink-0 h-full">
        {/* Main Nav Icons */}
        <div className="flex flex-col gap-6 w-full items-center">
          <NavItemRail icon={Home} label="Inicio" active={pathname === "/dashboard"} onClick={() => router.push("/dashboard")} badge={pendingCount > 0 ? pendingCount : undefined} />
          <NavItemRail icon={Calculator} label="Cotizar" active={pathname.includes("cotizaciones")} onClick={() => router.push("/dashboard/cotizaciones")} />
          <NavItemRail icon={Users} label="Clientes" active={pathname.includes("clientes")} onClick={() => router.push("/dashboard/clientes")} />
          <NavItemRail icon={FileText} label="Reportes" active={pathname.includes("reportes")} onClick={() => router.push("/dashboard/reportes")} />
          <NavItemRail icon={Tags} label="Tarifas" active={pathname.includes("tarifario")} onClick={() => router.push("/dashboard/tarifario")} />
          <NavItemRail icon={ArrowUpCircle} label="CP" active={pathname.includes("cp")} onClick={() => router.push("/dashboard/cp")} />
          <NavItemRail icon={Briefcase} label="Equipos" active={pathname.includes("equipos")} onClick={() => router.push("/dashboard/equipos")} />
          
          {isAdmin && (
             <NavItemRail icon={Shield} label="Usuarios" active={pathname.includes("usuarios")} onClick={() => router.push("/dashboard/usuarios")} className="text-white/90" />
          )}

        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-4 w-full items-center mb-2">
          <div 
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 cursor-pointer hover:bg-white hover:text-red-700 transition-all mt-2"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItemRail({ icon: Icon, label, active, className, onClick, badge }: { icon: LucideIcon, label: string, active?: boolean, className?: string, onClick?: () => void, badge?: number }) {
  return (
    <div 
      className="flex flex-col items-center gap-2 cursor-pointer group relative"
      onClick={onClick}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative",
        active ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
        className
      )}>
        <Icon className="h-6 w-6" />
        {badge && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium",
        active ? "text-white" : "text-white/60 group-hover:text-white"
      )}>
        {label}
      </span>
    </div>
  );
}
