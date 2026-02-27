"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  Users,
  CheckCircle2,
  FileText,
  Search,
  MoreHorizontal,
  FileDown
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("last_30_days");
  const [totalClients, setTotalClients] = useState<number | string>("-");

  // Mock data for Quotes History
  const quotesHistory: any[] = [];

  useEffect(() => {
    // Firebase stats fetching removed
    setTotalClients(0);
  }, []);

  const handleDownloadQuote = (id: string) => {
    toast.success(`Descargando cotización ${id}...`);
    // Here logic to generate/download PDF would go
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobada": return "bg-green-100 text-green-700 border-green-200";
      case "pendiente": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rechazada": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Mock data for KPIs
  const kpis = [
    {
      title: "Cotizaciones Hechas",
      value: quotesHistory.length.toString(), // Using mock length for demo
      change: "0%",
      trend: "neutral",
      icon: FileText,
      color: "bg-blue-50 text-blue-700"
    },
    {
      title: "Clientes Totales",
      value: totalClients,
      change: "0%",
      trend: "neutral",
      icon: Users,
      color: "bg-purple-50 text-purple-700"
    },
    {
      title: "Cotizaciones Concluidas",
      value: quotesHistory.filter(q => q.status === 'aprobada').length.toString(),
      change: "0%",
      trend: "neutral",
      icon: CheckCircle2,
      color: "bg-green-50 text-green-700"
    }
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona y descarga el historial de cotizaciones generadas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white">
              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
              <SelectItem value="last_90_days">Últimos 3 meses</SelectItem>
              <SelectItem value="this_year">Este año</SelectItem>
            </SelectContent>
          </Select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" />
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500`}>
                <span className="font-bold">-</span>
                {kpi.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quotes History Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Historial de Cotizaciones
          </h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar cotización..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Estado</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotesHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    No hay cotizaciones registradas aún.
                  </td>
                </tr>
              ) : (
                quotesHistory.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{quote.id}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{quote.client}</div>
                      <div className="text-xs text-gray-400">{quote.items} ítems</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{quote.date}</td>
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{quote.amount}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownloadQuote(quote.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Mostrando {quotesHistory.length} de {quotesHistory.length} resultados</span>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <button disabled className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}