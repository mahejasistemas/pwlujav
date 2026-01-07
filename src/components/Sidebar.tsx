"use client";

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
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // TODO: Implement actual admin check logic here
  const isAdmin = true; 

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex h-full">
      {/* 1. Slim Icon Rail (Leftmost) - Updated to match the dark visual style with labels below */}
      <div className="w-[72px] bg-red-700 flex flex-col items-center py-4 gap-2 z-20 shrink-0">
        
        {/* Main Nav Icons */}
        <div className="flex flex-col gap-6 w-full items-center">
          
          <NavItemRail icon={Home} label="Inicio" active={pathname === "/dashboard"} onClick={() => router.push("/dashboard")} />
          <NavItemRail icon={Calculator} label="Cotizar" active={pathname.includes("cotizaciones")} onClick={() => router.push("/dashboard/cotizaciones")} />
          <NavItemRail icon={Users} label="Clientes" active={pathname.includes("clientes")} onClick={() => router.push("/dashboard/clientes")} />
          <NavItemRail icon={FileText} label="Reportes" active={pathname.includes("reportes")} onClick={() => router.push("/dashboard/reportes")} />
          <NavItemRail icon={Tags} label="Tarifas" active={pathname.includes("tarifario")} onClick={() => router.push("/dashboard/tarifario")} />
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

function NavItemRail({ icon: Icon, label, active, className, onClick }: { icon: any, label: string, active?: boolean, className?: string, onClick?: () => void }) {
  return (
    <div 
      className="flex flex-col items-center gap-2 cursor-pointer group"
      onClick={onClick}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
        active ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
        className
      )}>
        <Icon className="h-6 w-6" />
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
