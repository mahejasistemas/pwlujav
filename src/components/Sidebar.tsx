"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Truck, 
  FileText, 
  MapPin,
  Box,
  LogOut,
  User,
  Calculator,
  CreditCard,
  FilePlus,
  History,
  Mail,
  DollarSign,
  BarChart,
  UserCog,
  Briefcase,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cotizaciones",
    href: "/dashboard/cotizaciones",
    icon: FileText,
  },
  {
    title: "Servicios",
    href: "/dashboard/servicios",
    icon: Briefcase,
  },
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "Rutas",
    href: "/dashboard/rutas",
    icon: MapPin,
  },
  {
    title: "Correos / Envíos",
    href: "/dashboard/correos",
    icon: Mail,
  },
  {
    title: "Tarifario",
    href: "/dashboard/tarifario",
    icon: DollarSign,
  },
  {
    title: "IA",
    href: "/dashboard/ia",
    icon: Bot,
  },
  {
    title: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (href: string) => pathname === href;
  const isSubmenuActive = (submenu: { title: string; href: string }[]) => 
    submenu.some(item => pathname === item.href);

  return (
    <aside 
      className="fixed left-0 top-0 z-40 h-screen w-20 border-r border-gray-200 bg-white"
    >
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <span className="text-xl font-bold text-white bg-[#B80000] h-8 w-8 rounded flex items-center justify-center">
          L
        </span>
      </div>

      <div className="flex flex-col justify-between h-[calc(100vh-4rem)]">
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-hidden flex flex-col items-center">
          {menuItems.map((item) => (
            <div key={item.title} className="w-full flex justify-center">
              {item.submenu ? (
                // Submenus logic simplified for icon-only mode
                 <div title={item.title}>
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={cn(
                      "flex items-center justify-center rounded-lg p-3 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900",
                      isSubmenuActive(item.submenu) || openSubmenus[item.title]
                        ? "text-[#B80000] bg-red-50" 
                        : "text-gray-500"
                    )}
                  >
                     <item.icon className="h-5 w-5" />
                  </button>
                 </div>
              ) : (
                <Link
                  href={item.href!}
                  title={item.title}
                  className={cn(
                    "flex items-center justify-center rounded-lg p-3 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900",
                    isActive(item.href!)
                      ? "bg-[#B80000] text-white"
                      : "text-gray-500"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4 flex justify-center">
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center justify-center rounded-lg p-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
