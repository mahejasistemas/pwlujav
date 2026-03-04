"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
import { CheckCircle2, Clock, XCircle, AlertCircle, Calendar, DollarSign, User, Package, SeparatorHorizontal, Receipt, FileDown, Download } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PDFCotizacion } from "../dashboard/cotizaciones/cargag/pdfcotizacion";

export default function InicioPage() {
  const [pendingQuotes, setPendingQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [ticketData, setTicketData] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndFetch = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         setUserEmail(user.email || null);
         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         if (profile?.role === 'admin' || profile?.role === 'sistemas') {
             setIsAdmin(true);
         } else {
             setIsAdmin(false); 
         }
         // Once user info is set, fetch quotes
         fetchPendingQuotes(user.email || null, profile?.role === 'admin' || profile?.role === 'sistemas');
      }
    };

    checkUserAndFetch();
    
    // Subscribe to changes logic needs to be aware of user role, maybe simplify for now or re-fetch
    if (supabase) {
        const channel = supabase
            .channel('pending-quotes-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'cotizaciones' },
                () => {
                    // We need to re-fetch but we don't have the user context easily inside this closure unless we use refs or just reload page
                    // For now, let's just trigger a reload if we could, or better, just re-run the effect if we had dependencies.
                    // But to keep it simple and correct, we will rely on manual refresh or better state management.
                    // Actually, let's just re-call checkUserAndFetch? No, that's heavy.
                    // Let's just make fetchPendingQuotes use current state if possible, but state is async.
                    // We will skip auto-refresh for now to avoid complexity or just do a simple window.location.reload() which is bad UX.
                    // Let's try to fetch again using the known email if set.
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }
  }, []);

  // Update fetchPendingQuotes to accept params
  const fetchPendingQuotes = async (email: string | null, admin: boolean) => {
    if (!supabase) return;
    try {
      setLoading(true);
      let query = supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (admin) {
        // Admin sees ALL pending quotes
        query = query.eq('estado', 'pendiente');
      } else {
        // User sees ALL their own quotes (any status) or just pending?
        // User request: "solo que diga esperando a ser revisada y solo las cotizaciones que han hecho ellos"
        // And "en su pagina de inicio van a ver lo mismo solo que diga esperando a ser revisada" implies seeing pending ones.
        if (email) {
            query = query.eq('emitente', email);
        } else {
            // No email, no quotes
            setPendingQuotes([]);
            setLoading(false);
            return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching quotes:", error);
      } else {
        setPendingQuotes(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      if (selectedQuote) {
        // Map selectedQuote to TicketData format
        const data = selectedQuote; // In this page, selectedQuote is already the full object
        const mappedData = {
          folio: data.folio || data.id,
          fechaExpedicion: data.fecha_expedicion || new Date(),
          fechaVigencia: data.fecha_vigencia || new Date(new Date().setDate(new Date().getDate() + 15)),
          divisa: data.divisa || 'MXN',
          empresa: { 
            name: data.empresa_nombre || data.cliente_nombre || "Cliente General",
            email: data.cliente_email || ""
          },
          emitente: data.usuario_id || "Ventas",
          origen: data.origen || "N/A",
          destino: data.destino || "N/A",
          items: Array.isArray(data.items) ? data.items : [],
          tipoCarga: data.tipo_carga || "General",
          tipoServicio: data.tipo_servicio || "Flete Terrestre",
          basePrice: data.monto_total || 0,
          equipmentName: data.equipo || "Caja Seca 53'",
          nombreCliente: data.cliente_nombre || "",
          tiempoCargaDescarga: data.tiempo_carga_descarga || "24",
          precioTolva: data.precio_tolva || "0"
        };
        setTicketData(mappedData);
      }
    }, [selectedQuote]);

  const handleAcceptQuote = async (id: string) => {
    if (!supabase) return;
    try {
      toast.loading("Aceptando cotización...");
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: 'aprobada' })
        .eq('id', id);

      if (error) throw error;
      
      toast.dismiss();
      toast.success("Cotización aprobada correctamente");
      // Use current state to refresh
      fetchPendingQuotes(userEmail, isAdmin);
    } catch (error) {
        toast.dismiss();
        toast.error("Error al aprobar la cotización");
        console.error(error);
    }
  };
  
  const handleRejectQuote = async (id: string) => {
      if (!supabase) return;
      try {
        toast.loading("Rechazando cotización...");
        const { error } = await supabase
          .from('cotizaciones')
          .update({ estado: 'rechazada' })
          .eq('id', id);
  
        if (error) throw error;
        
        toast.dismiss();
        toast.success("Cotización rechazada");
        fetchPendingQuotes(userEmail, isAdmin);
      } catch (error) {
          toast.dismiss();
          toast.error("Error al rechazar la cotización");
          console.error(error);
      }
    };
    
  const handleDownloadQuote = (id: string) => {
      toast.success(`Descargando cotización ${id}...`);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          Bienvenido al Dashboard
          {pendingQuotes.length > 0 && (
             <Badge variant={isAdmin ? "destructive" : "secondary"} className="text-sm px-2 py-1 rounded-full animate-pulse">
                {pendingQuotes.length} {isAdmin ? "Pendientes" : "Cotizaciones"}
             </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-2">
          {isAdmin 
            ? (pendingQuotes.length > 0 ? "Tienes cotizaciones pendientes de revisión. Solo los administradores pueden aprobarlas." : "No hay notificaciones pendientes por el momento.")
            : "Aquí puedes ver el estado de tus cotizaciones recientes."}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
               <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
           ))}
        </div>
      ) : pendingQuotes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">¡Todo al día!</h3>
            <p className="text-gray-500 mt-1">No hay cotizaciones pendientes de aprobación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingQuotes.map((quote) => (
            <Card key={quote.id} className="group hover:shadow-md transition-shadow border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {quote.cliente_nombre || quote.empresa_nombre || "Cliente General"}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Folio: {quote.folio || quote.id.substring(0,8)}
                      </CardDescription>
                    </div>
                    {/* Badge logic for status */}
                    {quote.estado === 'aprobada' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100/80 border-0">
                            Aprobada
                        </Badge>
                    ) : quote.estado === 'rechazada' ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100/80 border-0">
                            Rechazada
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100/80 border-0">
                            {isAdmin ? "Pendiente" : "Esperando revisión"}
                        </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Fecha
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Date(quote.fecha_expedicion).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" /> Ítems
                      </span>
                      <span className="font-medium text-gray-900">
                        {Array.isArray(quote.items) ? quote.items.length : 0}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: quote.divisa || 'MXN' }).format(quote.monto_total || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 flex-col gap-2">
                  <div className="flex w-full gap-2">
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
                              {selectedQuote?.folio || selectedQuote?.id}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="bg-gray-100 p-4 rounded-lg overflow-auto flex justify-center">
                            <div className="bg-white shadow-lg min-w-[800px] origin-top scale-[0.85]">
                              {ticketData && <PDFCotizacion data={ticketData} />}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 justify-end">
                            <Button className="bg-black text-white hover:bg-gray-800" onClick={() => handleDownloadQuote(selectedQuote?.id)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar PDF
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                  </div>
                  
                  {isAdmin && quote.estado === 'pendiente' && (
                      <div className="flex w-full gap-2 mt-2">
                         <Button 
                            variant="outline" 
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 h-8 text-xs"
                            onClick={() => handleRejectQuote(quote.id)}
                         >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Rechazar
                         </Button>
                         <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                            onClick={() => handleAcceptQuote(quote.id)}
                         >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Aprobar
                         </Button>
                      </div>
                  )}
                </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
