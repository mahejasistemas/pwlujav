"use client";

import { 
  Users, 
  Plus, 
  History, 
  Star, 
  FileText, 
  Search, 
  Settings, 
  MoreHorizontal,
  PenSquare,
  Clock,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ClientesSidebarProps {
  onNewClient: () => void;
}

export default function ClientesSidebar({ onNewClient }: ClientesSidebarProps) {
  return (
    <div className="w-64 flex flex-col h-full bg-[#F9F9FB] border-r border-gray-200 flex-shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <span>Clientes</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-200/50">
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>

      {/* New Client Button */}
      <div className="px-4 mb-6">
        <Button 
          onClick={onNewClient}
          className="w-full justify-start gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm h-10"
          variant="outline"
        >
          <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Plus className="h-3 w-3" />
          </div>
          <span className="flex-1 text-left">Agregar Cliente</span>
          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Nuevo</span>
        </Button>
      </div>

      {/* Navigation Menu */}
      <div className="px-3 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 font-normal">
          <Users className="h-4 w-4" />
          Ver Clientes
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 font-normal">
          <Star className="h-4 w-4" />
          Mis Clientes
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 font-normal">
          <FileText className="h-4 w-4" />
          Reportes
        </Button>
      </div>

      <div className="mt-6 px-4 mb-2">
        <span className="text-xs font-medium text-gray-400">Clientes Recientes</span>
      </div>

      {/* Recent List */}
      <div className="flex-1 px-3 overflow-auto">
        <div className="space-y-1">
          <div className="px-2 py-4 text-xs text-center text-gray-400">
            No hay clientes recientes
          </div>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Sistema activo</span>
          </div>
          <span>v1.2.0</span>
        </div>
      </div>
    </div>
  );
}
