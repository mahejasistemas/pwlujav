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
  FileDown,
  Receipt,
  Eye,
  Package
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { PDFCotizacion } from "../cotizaciones/cargag/pdfcotizacion";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("last_30_days");
  const [totalClients, setTotalClients] = useState<number | string>("-");
  const [quotesHistory, setQuotesHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin' || profile?.role === 'sistemas') {
            setIsAdmin(true);
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedQuote) {
      // Map selectedQuote to TicketData format required by PDFCotizacion
      const data = selectedQuote.originalData;
      const mappedData = {
        folio: data.folio || selectedQuote.id,
        fechaExpedicion: data.fecha_expedicion || new Date(),
        fechaVigencia: data.fecha_vigencia || new Date(new Date().setDate(new Date().getDate() + 15)), // Default 15 days validity
        divisa: data.divisa || 'MXN',
        empresa: { 
          name: data.empresa_nombre || data.cliente_nombre || "Cliente General",
          email: data.cliente_email || ""
        },
        emitente: data.usuario_id || "Ventas", // Fallback
        origen: data.origen || "N/A",
        destino: data.destino || "N/A",
        items: Array.isArray(data.items) ? data.items : [],
        tipoCarga: data.tipo_carga || "General",
        tipoServicio: data.tipo_servicio || "Flete Terrestre",
        basePrice: data.monto_total || 0,
        equipmentName: data.equipo || "Caja Seca 53'", // Fallback
        nombreCliente: data.cliente_nombre || "",
        tiempoCargaDescarga: data.tiempo_carga_descarga || "24",
        precioTolva: data.precio_tolva || "0"
      };
      setTicketData(mappedData);
    }
  }, [selectedQuote]);

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('cotizaciones')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply user filter if not admin
        // We need to wait for userEmail to be set, or fetch it here if not available yet?
        // Since userEmail is set in another effect, it might race. 
        // Better to fetch user here or depend on userEmail state.
        // Let's modify dependency array to include userEmail and only run if we determined user status.
        // But initial load might be slow.
        
        // Let's check auth directly here to be sure for this request context
        const { data: { user } } = await supabase.auth.getUser();
        let isUserAdmin = false;
        if (user) {
             const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
             if (profile?.role === 'admin' || profile?.role === 'sistemas') {
                 isUserAdmin = true;
             }
             
             if (!isUserAdmin) {
                 query = query.eq('emitente', user.email);
             }
        } else {
            // No user, no data
            setLoading(false);
            return;
        }

        // Apply time range filter
        const now = new Date();
        let startDate: Date | null = null;

        switch (timeRange) {
          case "last_7_days":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
          case "last_30_days":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 30);
            break;
          case "last_90_days":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 90);
            break;
          case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching quotes:", error);
          toast.error("Error al cargar historial de cotizaciones");
        } else if (data) {
          // Transform data to match UI expected format
          const formattedQuotes = data.map((q, index) => {
             // Ensure unique ID for key: prefer id (UUID), then folio, then fallback to index combo
             // Adding prefix to avoid any numeric collision
             const uniqueKey = q.id || `quote-${q.folio}-${index}`; 
             const displayId = q.folio || (q.id ? String(q.id).substring(0, 8) : `quote-${index}`);
             
             return {
              id: displayId, // Display ID
              uniqueId: uniqueKey, // Internal Unique Key for React
              client: q.cliente_nombre || q.empresa_nombre || "Cliente General",
              date: q.fecha_expedicion ? new Date(q.fecha_expedicion).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Fecha no disponible',
              amount: new Intl.NumberFormat('es-MX', { style: 'currency', currency: q.divisa || 'MXN' }).format(q.monto_total || 0),
              status: q.estado || 'pendiente',
              itemsCount: Array.isArray(q.items) ? q.items.length : 0,
              originalData: q // Keep full data if needed for download/details
            };
          });
          setQuotesHistory(formattedQuotes);
          
          // Calculate unique clients count roughly
          const uniqueClients = new Set(data.map(q => q.cliente_nombre || q.empresa_nombre).filter(Boolean)).size;
          setTotalClients(uniqueClients);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [timeRange]); // Add timeRange logic filtering later if needed

  const handleDownloadQuote = (id: string) => {
    // Uses the print styles defined in PDFCotizacion component
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobada": return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100/80";
      case "pendiente": return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100/80";
      case "rechazada": return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100/80";
      default: return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100/80";
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
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          
          <Button className="bg-black text-white hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="font-normal text-gray-500">
                  {kpi.change}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quotes History Grid */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando cotizaciones...</div>
        ) : quotesHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border rounded-xl bg-gray-50">
            No hay cotizaciones registradas aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotesHistory.map((quote) => (
              <Card key={quote.uniqueId} className="group hover:shadow-md transition-shadow border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {quote.client}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Folio: {quote.id}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(quote.status)} border-0`}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Fecha
                      </span>
                      <span className="font-medium text-gray-900">{quote.date}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> Ítems
                      </span>
                      <span className="font-medium text-gray-900">{quote.itemsCount}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="text-lg font-bold text-gray-900">{quote.amount}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 hover:bg-gray-50"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <Receipt className="w-4 h-4" />
                        Ver Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold">Vista Previa de Cotización</DialogTitle>
                        <DialogDescription className="text-center">
                          {selectedQuote?.id}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="bg-gray-100 p-4 rounded-lg overflow-auto flex justify-center">
                        <div className="bg-white shadow-lg min-w-[800px] origin-top scale-[0.85]">
                          {ticketData && <PDFCotizacion data={ticketData} />}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4 justify-end">
                        {selectedQuote?.status === 'aprobada' ? (
                            <Button className="bg-black text-white hover:bg-gray-800" onClick={() => handleDownloadQuote(selectedQuote?.id)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar PDF
                            </Button>
                        ) : (
                            <div className="group relative">
                                <Button disabled className="bg-gray-300 text-gray-500 cursor-not-allowed">
                                  <Download className="w-4 h-4 mr-2" />
                                  Descargar PDF
                                </Button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Solo disponible para cotizaciones aprobadas
                                </div>
                            </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {quote.status === 'aprobada' ? (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleDownloadQuote(quote.id)}
                        title="Descargar PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </Button>
                  ) : (
                      <div className="group relative">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            disabled
                            className="text-gray-300 cursor-not-allowed"
                            title="Descargar PDF (Solo aprobadas)"
                          >
                            <FileDown className="w-4 h-4" />
                          </Button>
                      </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Pagination placeholder */}
        <div className="p-4 flex items-center justify-between text-sm text-gray-500">
          <span>Mostrando {quotesHistory.length} de {quotesHistory.length} resultados</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" disabled>Siguiente</Button>
          </div>
        </div>
      </div>
    </div>
  );
}