"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar as CalendarIcon, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PDFCotizacionMix } from "./pdfcotizacion";
import { toast } from "sonner";

interface EquipoCargaMix {
  id: string;
  servicio: string;
  largo: string | null;
  ancho: string | null;
  peso_reglamentario: string | null;
  sobrepeso: string | null;
  alto: string | null;
  modalidad: string;
}

interface SimpleCompany {
  id: string;
  name: string;
}

interface SimpleClient {
  id: string;
  name: string;
  company?: string;
}

interface QuoteOption {
  equipmentName: string;
  tariffType: string;
  basePrice: number;
  currency: "USD" | "EUR" | "MXN";
}

interface CargoItem {
  id: string;
  cantidad: string;
  largo: string;
  ancho: string;
  alto: string;
  peso: string;
}

export default function CargaMixtaPage() {
  const [empresa, setEmpresa] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [diaExpedicion, setDiaExpedicion] = useState(new Date().toISOString().split("T")[0]);
  const [diaVigencia, setDiaVigencia] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  });
  const [emitente, setEmitente] = useState("");
  const [numeroCotizacion, setNumeroCotizacion] = useState("");

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [searchedOrigen, setSearchedOrigen] = useState("");
  const [searchedDestino, setSearchedDestino] = useState("");

  const [cargoItems, setCargoItems] = useState<CargoItem[]>([
    { id: "1", cantidad: "1", largo: "", ancho: "", alto: "", peso: "" }
  ]);
  const [divisa, setDivisa] = useState<"USD" | "EUR" | "MXN">("MXN");
  const [tiempoCargaDescarga, setTiempoCargaDescarga] = useState("24");
  const [precioTolva, setPrecioTolva] = useState(""); 

  const [availableServices, setAvailableServices] = useState<EquipoCargaMix[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState("");
  
  const [companies, setCompanies] = useState<SimpleCompany[]>([]);
  const [clients, setClients] = useState<SimpleClient[]>([]);

  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // --- UTILS ---
  const addCargoItem = () => {
    setCargoItems([
      ...cargoItems,
      { id: Math.random().toString(36).substring(2, 9), cantidad: "1", largo: "", ancho: "", alto: "", peso: "" }
    ]);
  };

  const removeCargoItem = (id: string) => {
    if (cargoItems.length > 1) {
      setCargoItems(cargoItems.filter(item => item.id !== id));
    }
  };

  const updateCargoItem = (id: string, field: keyof CargoItem, value: string) => {
    setCargoItems(cargoItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalVolumen = cargoItems.reduce((acc, item) => {
    const vol = (parseFloat(item.largo) || 0) * (parseFloat(item.ancho) || 0) * (parseFloat(item.alto) || 0) * (parseFloat(item.cantidad) || 0);
    return acc + vol;
  }, 0);

  const totalPeso = cargoItems.reduce((acc, item) => {
    const pesoTotalItem = (parseFloat(item.cantidad) || 0) * (parseFloat(item.peso) || 0);
    return acc + pesoTotalItem;
  }, 0);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadUser = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        setEmitente(data.user.email);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadEquipments = async () => {
      if (!supabase) return;
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from("equipos_cargamix")
          .select("*")
          .order('servicio', { ascending: true });
        
        if (!error && data) {
          setAvailableServices(data);
        }
      } catch (error) {
        console.error("Error loading equipments:", error);
      } finally {
        setLoadingServices(false);
      }
    };
    loadEquipments();
  }, []);

  useEffect(() => {
    const fetchCompaniesAndClients = async () => {
      if (!supabase) return;
      
      try {
        // Fetch companies
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, name')
          .order('name');
          
        if (companiesData) {
          setCompanies(companiesData);
        }
        
        // Fetch clients
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, name, company')
          .order('name');
          
        if (clientsData) {
          setClients(clientsData.map((c: any) => ({
            id: c.id,
            name: c.name,
            company: c.company
          })));
        }
      } catch (error) {
        console.error("Error fetching companies/clients:", error);
      }
    };
    
    fetchCompaniesAndClients();
  }, []);

  // --- FOLIO GENERATION ---
  useEffect(() => {
    const fetchNextFolio = async () => {
        if (!supabase || !origen) return;
        
        let prefix = "MIX"; 
        const parts = origen.split(",");
        if (parts.length > 1) {
            const state = parts[parts.length - 1].trim();
            prefix = state.substring(0, 3).toUpperCase();
        } else {
            prefix = origen.substring(0, 3).toUpperCase();
        }
        prefix = prefix.replace(/[^A-Z0-9]/g, "").padEnd(3, "X").substring(0, 3);
        
        const year = new Date().getFullYear().toString().slice(-2);
        
        // Global sequence check
        const pattern = `___${year}%`;
        
        try {
            const { data } = await supabase
                .from('cotizaciones')
                .select('folio')
                .like('folio', pattern)
                .order('created_at', { ascending: false })
                .limit(1);
                
            let nextSequence = 1;
            
            if (data && data.length > 0 && data[0].folio) {
                const lastFolio = data[0].folio;
                const lastSeqStr = lastFolio.slice(-3);
                const lastSeqNum = parseInt(lastSeqStr, 10);
                if (!isNaN(lastSeqNum)) {
                    nextSequence = lastSeqNum + 1;
                }
            }
            
            const sequenceStr = nextSequence.toString().padStart(3, "0");
            const nextFolio = `${prefix}${year}${sequenceStr}`;
            setNumeroCotizacion(nextFolio);
        } catch (err) {
            setNumeroCotizacion(`${prefix}${year}001`);
        }
    };

    fetchNextFolio();
  }, [origen]);

  // State for manual price input in the main form
  const [manualPrice, setManualPrice] = useState("");

  const handleGenerateTicket = () => {
      const price = parseFloat(manualPrice);
      
      if (!price || price <= 0) {
          toast.error("Debes ingresar un precio válido para el flete.");
          return;
      }
      
      if (!origen.trim() || !destino.trim()) {
          toast.error("Debes indicar origen y destino.");
          return;
      }
      
      if (!servicioSeleccionado) {
          toast.error("Selecciona un equipo.");
          return;
      }

      const selectedOption: QuoteOption = {
          equipmentName: availableServices.find(s => s.id === servicioSeleccionado)?.servicio || "Carga Mixta",
          tariffType: "Manual",
          basePrice: price,
          currency: divisa
      };

      setTicketData({
          ...selectedOption,
          empresa,
          nombreCliente: empresa,
          emitente,
          fechaExpedicion: diaExpedicion,
          fechaVigencia: diaVigencia,
          folio: numeroCotizacion,
          origen: searchedOrigen || origen,
          destino: searchedDestino || destino,
          items: cargoItems,
          tipoCarga: "Carga Mixta",
          tipoServicio: selectedOption.equipmentName,
          tiempoCargaDescarga,
          precioTolva
      });
      setShowTicket(true);
  };

  const hasRoute = searchedOrigen && searchedDestino;
  const mapUrl = mapsApiKey && hasRoute
      ? `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(searchedOrigen)}&destination=${encodeURIComponent(searchedDestino)}&mode=driving`
      : `https://www.google.com/maps?q=${encodeURIComponent("Mexico")}&output=embed`;

  // --- RENDER ---
  if (showTicket && ticketData) {
    return (
      <div className="space-y-6 p-8 pt-6 max-w-4xl mx-auto print:p-0 print:max-w-none">
        <div className="flex justify-between items-center mb-6 no-print print:hidden">
          <Button variant="outline" onClick={() => setShowTicket(false)}>
            ← Volver al formulario
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              Imprimir / PDF
            </Button>
            <Button onClick={async () => {
               if (!supabase) return;
               
               const quoteToSave = {
                 folio: ticketData.folio,
                 cliente_nombre: ticketData.nombreCliente || ticketData.empresa,
                 empresa_nombre: typeof ticketData.empresa === 'string' ? ticketData.empresa : ticketData.empresa?.name,
                 fecha_expedicion: ticketData.fechaExpedicion,
                 fecha_vigencia: ticketData.fechaVigencia,
                 origen: ticketData.origen,
                 destino: ticketData.destino,
                 monto_total: (ticketData.basePrice || 0) + (ticketData.precioTolva ? parseFloat(ticketData.precioTolva) : 0),
                 divisa: ticketData.divisa || 'MXN',
                 estado: 'pendiente',
                 items: ticketData.items,
                 emitente: ticketData.emitente,
                 tipo_servicio: ticketData.tipoServicio,
                 detalles_adicionales: {
                    tiempoCargaDescarga: ticketData.tiempoCargaDescarga,
                    precioTolva: ticketData.precioTolva,
                    tipoCarga: ticketData.tipoCarga,
                    categoria: "Carga Mixta"
                 }
               };

               try {
                 const { error } = await supabase.from('cotizaciones').insert([quoteToSave]);
                 if (error) throw error;
                 toast.success("Cotización guardada exitosamente.");
               } catch (err: any) {
                 toast.error("Error al guardar: " + err.message);
               }
            }}>
              Guardar Cotización
            </Button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <PDFCotizacionMix data={ticketData} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Cotización - Carga Mixta
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Equipos especializados para cargas sobredimensionadas.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleGenerateTicket(); }} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <div className="relative">
                      <Input
                        id="empresa"
                        value={empresa}
                        onChange={(event) => setEmpresa(event.target.value)}
                        placeholder="Razón Social / Nombre de la Empresa"
                        required
                        list="companies-list"
                      />
                      <datalist id="companies-list">
                        {companies.map((company) => (
                          <option key={company.id} value={company.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombreCliente">Nombre del Cliente (Contacto)</Label>
                    <div className="relative">
                      <Input
                        id="nombreCliente"
                        value={nombreCliente}
                        onChange={(event) => {
                            const val = event.target.value;
                            setNombreCliente(val);
                            
                            // Optional: Auto-fill company if client is selected from list
                            const foundClient = clients.find(c => c.name === val);
                            if (foundClient && foundClient.company && !empresa) {
                                setEmpresa(foundClient.company);
                            }
                        }}
                        placeholder="Persona de contacto"
                        list="clients-list"
                      />
                      <datalist id="clients-list">
                        {clients.map((client) => (
                           <option key={client.id} value={client.name}>
                             {client.company ? `${client.name} - ${client.company}` : client.name}
                           </option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emitente">Emitente</Label>
                    <Input
                      id="emitente"
                      value={emitente}
                      onChange={(e) => setEmitente(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Fecha Expedición</Label>
                    <Input type="date" value={diaExpedicion} onChange={(e) => setDiaExpedicion(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Vigencia</Label>
                    <Input type="date" value={diaVigencia} onChange={(e) => setDiaVigencia(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Folio (Auto)</Label>
                    <Input value={numeroCotizacion} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <Label>Equipo Sobredimensionado</Label>
                    <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.servicio} {eq.largo ? `(${eq.largo})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Info del equipo seleccionado */}
                {servicioSeleccionado && (
                    <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-xs grid grid-cols-2 gap-2">
                        {(() => {
                            const eq = availableServices.find(s => s.id === servicioSeleccionado);
                            if (!eq) return null;
                            return (
                                <>
                                    <div><strong>Dimensiones:</strong> {eq.largo || 'N/A'} x {eq.ancho || 'N/A'} x {eq.alto || 'N/A'}</div>
                                    <div><strong>Capacidad:</strong> {eq.peso_reglamentario || 'N/A'} (Max: {eq.sobrepeso || 'N/A'})</div>
                                    <div><strong>Modalidad:</strong> {eq.modalidad}</div>
                                </>
                            );
                        })()}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 pt-4 mt-2 border-t border-gray-100">
                   <div className="space-y-2">
                    <Label>Tiempo Carga/Descarga</Label>
                    <Select value={tiempoCargaDescarga} onValueChange={setTiempoCargaDescarga}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 Horas</SelectItem>
                        <SelectItem value="24">24 Horas</SelectItem>
                        <SelectItem value="48">48 Horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Costo Adicional / Maniobras</Label>
                    <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={precioTolva} 
                        onChange={(e) => setPrecioTolva(e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Detalles de la Carga</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addCargoItem} className="h-8 gap-1">
                  <Plus className="h-4 w-4" /> Agregar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cargoItems.map((item, index) => (
                  <div key={item.id} className="relative space-y-4 rounded-lg border border-gray-100 p-4 pt-6">
                    <div className="absolute left-3 top-[-10px] bg-white px-2 text-xs font-medium text-gray-500">
                        Ítem #{index + 1}
                    </div>
                    {cargoItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={() => removeCargoItem(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                    <div className="grid gap-2 grid-cols-5">
                       <div className="col-span-1"><Label className="text-xs">Cant.</Label><Input type="number" value={item.cantidad} onChange={(e) => updateCargoItem(item.id, "cantidad", e.target.value)} /></div>
                       <div className="col-span-1"><Label className="text-xs">Largo</Label><Input type="number" value={item.largo} onChange={(e) => updateCargoItem(item.id, "largo", e.target.value)} /></div>
                       <div className="col-span-1"><Label className="text-xs">Ancho</Label><Input type="number" value={item.ancho} onChange={(e) => updateCargoItem(item.id, "ancho", e.target.value)} /></div>
                       <div className="col-span-1"><Label className="text-xs">Alto</Label><Input type="number" value={item.alto} onChange={(e) => updateCargoItem(item.id, "alto", e.target.value)} /></div>
                       <div className="col-span-1"><Label className="text-xs">Peso</Label><Input type="number" value={item.peso} onChange={(e) => updateCargoItem(item.id, "peso", e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-sm font-medium">
                    <span>Peso Total: {totalPeso.toFixed(2)} tons</span>
                    <span>Volumen: {totalVolumen.toFixed(2)} m³</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 h-full flex flex-col">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-base">Ruta y Cotización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Origen</Label>
                    <Input value={origen} onChange={(e) => setOrigen(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Input value={destino} onChange={(e) => setDestino(e.target.value)} required />
                  </div>
                </div>

                <div className="mt-2 flex-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 min-h-[300px]">
                  <iframe
                    key={mapUrl}
                    src={mapUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                {/* Manual Price Entry (Integrated directly into main flow) */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Precio del Servicio</h4>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs">Moneda</Label>
                            <Select value={divisa} onValueChange={(v: any) => setDivisa(v)}>
                                <SelectTrigger className="bg-white h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                                    <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs">Costo Flete (Base)</Label>
                            <Input 
                                type="number" 
                                className="bg-white" 
                                placeholder="0.00"
                                value={manualPrice}
                                onChange={(e) => setManualPrice(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Generar Cotización
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
