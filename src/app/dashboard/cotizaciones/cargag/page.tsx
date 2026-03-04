"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar as CalendarIcon, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { PDFCotizacion } from "./pdfcotizacion";

type CompanySelectionMode = "manual" | "company" | "client";

type LoadType = "full" | "sencillo" | "full_sobrepeso" | "sencillo_sobrepeso" | "rabon";

interface SimpleCompany {
  id: string;
  name: string;
}

interface SimpleClient {
  id: string;
  name: string;
  company?: string;
}

interface Tolva {
  id: string;
  nombre: string;
  precio_base: number;
}

type TariffType = "rabon" | "sencillo" | "full";

interface TariffRow {
  id: string;
  origen: string;
  destino: string;
  rabon: number;
  sencillo: number;
  sencillo_sobrepeso: number;
  full: number;
  full_sobrepeso: number;
}

export interface GeneralCargoEquipment {
  id: string;
  name: string;
  largo: number;
  ancho: number;
  alto: number;
  peso_max: number;
  tariff_type: TariffType;
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

export default function CargaGeneralPage() {
  const [empresa, setEmpresa] = useState("");
  const [nombreCliente, setNombreCliente] = useState(""); // Nuevo estado para el nombre del cliente (contacto)
  const [diaExpedicion, setDiaExpedicion] = useState(new Date().toISOString().split("T")[0]);
  const [diaVigencia, setDiaVigencia] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 45);
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
  const [divisa, setDivisa] = useState<"USD" | "EUR" | "MXN" | "">("MXN");

  // New fields for Cargo Time and Hopper Price - Moved UP to fix dependency error
  const [tiempoCargaDescarga, setTiempoCargaDescarga] = useState("12");
  const [precioTolva, setPrecioTolva] = useState(""); // Can be auto-filled from Supabase or manual input

  // --- PERSISTENCE LOGIC START ---
  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("cotizacion_cargag_draft");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.empresa) setEmpresa(parsed.empresa);
        if (parsed.diaExpedicion) setDiaExpedicion(parsed.diaExpedicion);
        if (parsed.diaVigencia) setDiaVigencia(parsed.diaVigencia);
        if (parsed.emitente) setEmitente(parsed.emitente);
        // numeroCotizacion is auto-generated or managed, maybe skip or load if manually edited? 
        // Let's load it if it exists, but the effect [origen] might overwrite it.
        // if (parsed.numeroCotizacion) setNumeroCotizacion(parsed.numeroCotizacion);
        
        if (parsed.origen) setOrigen(parsed.origen);
        if (parsed.destino) setDestino(parsed.destino);
        if (parsed.cargoItems) setCargoItems(parsed.cargoItems);
        if (parsed.divisa) setDivisa(parsed.divisa);
        if (parsed.servicioSeleccionado) setServicioSeleccionado(parsed.servicioSeleccionado);
        if (parsed.loadType) setLoadType(parsed.loadType);
        if (parsed.companySelectionMode) setCompanySelectionMode(parsed.companySelectionMode);
        if (parsed.tiempoCargaDescarga) setTiempoCargaDescarga(parsed.tiempoCargaDescarga);
        if (parsed.precioTolva) setPrecioTolva(parsed.precioTolva);
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      empresa,
      diaExpedicion,
      diaVigencia,
      emitente,
      numeroCotizacion,
      origen,
      destino,
      cargoItems,
      divisa,
      tiempoCargaDescarga,
      precioTolva
    };
    localStorage.setItem("cotizacion_cargag_draft", JSON.stringify(dataToSave));
  }, [
    empresa,
    diaExpedicion,
    diaVigencia,
    emitente,
    numeroCotizacion,
    origen,
    destino,
    cargoItems,
    divisa,
    tiempoCargaDescarga,
    precioTolva
  ]);

  const clearDraft = () => {
    localStorage.removeItem("cotizacion_cargag_draft");
    // Reset state to defaults
    setEmpresa("");
    setDiaExpedicion(new Date().toISOString().split("T")[0]);
    const date = new Date();
    date.setDate(date.getDate() + 45);
    setDiaVigencia(date.toISOString().split("T")[0]);
    // emitente is usually set from auth user, so we might want to re-fetch or keep it
    setOrigen("");
    setDestino("");
    setSearchedOrigen("");
    setSearchedDestino("");
    setCargoItems([{ id: "1", cantidad: "1", largo: "", ancho: "", alto: "", peso: "" }]);
    setDivisa("MXN");
    setServicioSeleccionado("");
    setLoadType("");
    setCompanySelectionMode("manual");
    setTiempoCargaDescarga("12");
    setPrecioTolva("");
    setQuoteOptions([]);
    setQuoteError(null);
    window.location.reload(); // Simple way to ensure clean slate including auth user re-fetch
  };
  // --- PERSISTENCE LOGIC END ---

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

  const [companies, setCompanies] = useState<SimpleCompany[]>([]);
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [availableServices, setAvailableServices] = useState<GeneralCargoEquipment[]>([]);
  const [tolvas, setTolvas] = useState<Tolva[]>([]); // Lista de tolvas
  const [selectedTolva, setSelectedTolva] = useState<string>(""); // Tolva seleccionada
  
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState("");
  const [companySelectionMode, setCompanySelectionMode] = useState<CompanySelectionMode>("manual");
  const [loadType, setLoadType] = useState<LoadType | "">("");
  
  // New fields for Cargo Time and Hopper Price were moved UP

  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  // --- TICKET VIEW STATE ---
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const selectedService = useMemo(() => 
    availableServices.find(s => s.id === servicioSeleccionado),
    [availableServices, servicioSeleccionado]
  );

  const allowedLoadTypes = useMemo(() => {
    if (!selectedService) return [];
    
    const name = selectedService.name.toLowerCase();
    
    // Rabon only allows Rabon
    if (name.includes("rabon")) {
      return ["rabon"];
    }
    
    // 53ft allows Sencillo (Single) and Sencillo Sobrepeso
    if (name.includes("53")) {
      return ["sencillo", "sencillo_sobrepeso"];
    }
    
    // 20ft and 40ft allow Full and Sencillo
    if (name.includes("20") || name.includes("40")) {
      return ["sencillo", "sencillo_sobrepeso", "full", "full_sobrepeso"];
    }
    
    // Default fallback
    return ["sencillo", "sencillo_sobrepeso", "full", "full_sobrepeso"];
  }, [selectedService]);

  // Reset loadType if not allowed
  useEffect(() => {
    if (loadType && allowedLoadTypes.length > 0 && !allowedLoadTypes.includes(loadType as any)) {
      setLoadType("");
    }
  }, [allowedLoadTypes, loadType]);

  useEffect(() => {
    if (diaExpedicion) {
      const date = new Date(diaExpedicion);
      date.setDate(date.getDate() + 45);
      setDiaVigencia(date.toISOString().split("T")[0]);
    }
  }, [diaExpedicion]);

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
      console.log("DEBUG: Iniciando carga de equipos desde Supabase...");
      if (!supabase) {
        console.error("DEBUG: Cliente Supabase es null/undefined");
        return;
      }
      setLoadingServices(true);
      setServicesError(null);
      try {
        const { data: equipmentsData, error: equipmentsError } = await supabase
          .from("carga_general")
          .select("*");
        
        console.log("DEBUG: Datos recibidos de Supabase:", equipmentsData);
        if (equipmentsError) console.error("DEBUG: Error de Supabase:", equipmentsError);

        if (!equipmentsError && equipmentsData) {
          // Mapeo defensivo de datos para asegurar compatibilidad
          const mappedServices = equipmentsData.map((item: any, index: number) => ({
            id: item.id ? String(item.id) : `generated-${index}`,
            name: item.servicios || item.servicio || item.name || item.nombre || "Sin nombre",
            largo: Number(item.largo) || 0,
            ancho: Number(item.ancho) || 0,
            alto: Number(item.alto) || 0,
            peso_max: Number(item.peso_max) || 0,
            tariff_type: item.tariff_type || "sencillo"
          })).sort((a, b) => a.name.localeCompare(b.name));

          setAvailableServices(mappedServices);
        } else if (equipmentsError) {
          console.error("Error loading equipments from Supabase:", equipmentsError);
          setServicesError(equipmentsError.message);
        }
      } catch (error: any) {
        console.error("Unexpected error loading equipments:", error);
        setServicesError(error.message || "Error inesperado");
      } finally {
        setLoadingServices(false);
      }
    };

    loadEquipments();
  }, [supabase]);

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

      // Fetch Tolvas
      const { data: tolvasData } = await supabase
        .from('tolvas')
        .select('id, nombre, precio_base')
        .order('nombre');
        
      if (tolvasData) {
         setTolvas(tolvasData);
      }

    } catch (error) {
      console.error("Error fetching companies/clients/tolvas:", error);
    }
  };
  
  fetchCompaniesAndClients();
}, []);

// Watch for selectedTolva changes to update price
useEffect(() => {
   if (selectedTolva) {
      const t = tolvas.find(item => item.id === selectedTolva);
      if (t) {
         // If price is > 0, set it. If 0, maybe clear it to force manual entry or set 0.
         // Let's set it to whatever is in DB.
         setPrecioTolva(t.precio_base ? t.precio_base.toString() : "");
      }
   }
}, [selectedTolva, tolvas]);

  // Auto-generate folio when origin changes
  useEffect(() => {
    // If we already have a folio set (e.g. from draft or previous generation), we might want to keep it
    // BUT the requirement says: "no cambies hasta que la cotizacion se guarde".
    // So here we should just generate a PREVIEW folio or keep it empty/static until save?
    // Actually, user says: "el numero cambia dependiendo de las cotizaciones que se hagan... no cambies hasta que la cotizacion se guarde".
    // This implies we should fetch the *next available* folio number based on DB count/last entry.
    
    const fetchNextFolio = async () => {
        if (!supabase || !origen) return;
        
        // 1. Determine Prefix based on Origin
        let prefix = "GEN"; 
        const parts = origen.split(",");
        if (parts.length > 1) {
            const state = parts[parts.length - 1].trim();
            prefix = state.substring(0, 3).toUpperCase();
        } else {
            prefix = origen.substring(0, 3).toUpperCase();
        }
        prefix = prefix.replace(/[^A-Z0-9]/g, "").padEnd(3, "X").substring(0, 3);
        
        // 2. Year YY
        const year = new Date().getFullYear().toString().slice(-2);
        
        // 3. Find last folio with this prefix/year pattern to increment
        // Pattern: PREFIX + YEAR + SEQUENCE (e.g. VER24001)
        const pattern = `${prefix}${year}%`;
        
        try {
            const { data, error } = await supabase
                .from('cotizaciones')
                .select('folio')
                .ilike('folio', pattern)
                .order('created_at', { ascending: false })
                .limit(1);
                
            let nextSequence = 1;
            
            if (data && data.length > 0 && data[0].folio) {
                const lastFolio = data[0].folio;
                // Extract sequence (last 3 digits)
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
            console.error("Error generating folio:", err);
            // Fallback
            setNumeroCotizacion(`${prefix}${year}001`);
        }
    };

    fetchNextFolio();
    
  }, [origen]); // Re-run when origin changes to update prefix match


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearchedOrigen(origen.trim());
    setSearchedDestino(destino.trim());

    setQuoteError(null);
    setQuoteLoading(true);
    setQuoteOptions([]);

    try {
      const origenTexto = origen.trim();
      const destinoTexto = destino.trim();
      if (!origenTexto || !destinoTexto) {
        setQuoteError("Debes indicar origen y destino para cotizar.");
        return;
      }

      if (cargoItems.some(item => !item.largo || !item.ancho || !item.alto || !item.peso || !item.cantidad)) {
        setQuoteError("Debes completar todos los datos de cada ítem de carga.");
        return;
      }

      const maxLargo = Math.max(...cargoItems.map(i => parseFloat(i.largo) || 0));
      const maxAncho = Math.max(...cargoItems.map(i => parseFloat(i.ancho) || 0));
      const maxAlto = Math.max(...cargoItems.map(i => parseFloat(i.alto) || 0));
      const totalPesoNum = totalPeso;

      if (!supabase) {
        setQuoteError("Supabase no está configurado para consultar carga general.");
        return;
      }

      // Determine which table to search based on Origin
      const originLower = origenTexto.toLowerCase();
      let baseOrigen = "";
      
      if (originLower.includes("manzanillo")) {
        baseOrigen = "Manzanillo";
      } else if (originLower.includes("veracruz")) {
        baseOrigen = "Veracruz";
      } else if (originLower.includes("altamira")) {
        baseOrigen = "Altamira";
      } else {
        setQuoteError("Por el momento solo contamos con tarifas desde Manzanillo, Veracruz y Altamira.");
        return;
      }

      // Query Supabase directly on the consolidated table
      // Note: We use ilike for case-insensitive matching. 
      // We assume the destination in DB is stored somewhat cleanly.
      
      const { data: tariffData, error: tariffError } = await supabase
        .from("tarifas_generales")
        .select("*")
        .ilike('origen', `%${baseOrigen}%`)
        .ilike('destino', `%${destinoTexto}%`); // Simple partial match

      if (tariffError) {
        console.error("Error fetching tariff:", tariffError);
        setQuoteError(tariffError.message);
        return;
      }

      if (!tariffData || tariffData.length === 0) {
        setQuoteError(`No se encontró una tarifa desde ${baseOrigen} hacia ${destinoTexto}.`);
        return;
      }

      // If multiple results, we might want to pick the best match.
      // For now, let's pick the first one.
      const tarifa = tariffData[0]; // Simplest approach for now

      // We already have services in state, let's use them
      let equipmentsToUse = availableServices;

      // If for some reason state is empty, try to fetch again (fallback)
      if (equipmentsToUse.length === 0) {
        const { data: equipmentsData, error: equipmentsError } = await supabase
          .from("carga_general")
          .select("*");

        if (equipmentsError) {
          setQuoteError("No se pudieron obtener los equipos de carga general.");
          return;
        }
        equipmentsToUse = (equipmentsData || []) as GeneralCargoEquipment[];
      }

      // If a specific service is selected, we prioritize it
      let selectedEquipment = null;
      if (servicioSeleccionado) {
        selectedEquipment = equipmentsToUse.find(eq => eq.id === servicioSeleccionado);
      }

      const candidates = equipmentsToUse.filter((eq) => {
        const largoMax = eq.largo || 0;
        const anchoMax = eq.ancho || 0;
        const altoMax = eq.alto || 0;
        const pesoMax = eq.peso_max || 0;

        const fitsLargo = !largoMax || maxLargo <= largoMax;
        const fitsAncho = !anchoMax || maxAncho <= anchoMax;
        const fitsAlto = !altoMax || maxAlto <= altoMax;
        const fitsPeso = !pesoMax || totalPesoNum <= pesoMax;

        return fitsLargo && fitsAncho && fitsAlto && fitsPeso;
      });

      if (!candidates.length && !selectedEquipment) {
        setQuoteError("No se encontraron equipos en carga general que soporten estas medidas.");
        return;
      }

      const sorted = [...candidates].sort((a, b) => {
        const pesoA = a.peso_max || 0;
        const pesoB = b.peso_max || 0;
        if (pesoA && pesoB) {
          return pesoA - pesoB;
        }
        return 0;
      });

      // Ensure the selected equipment is at the top if it exists
      if (selectedEquipment && !sorted.find(e => e.id === selectedEquipment!.id)) {
        sorted.unshift(selectedEquipment);
      } else if (selectedEquipment) {
        const index = sorted.findIndex(e => e.id === selectedEquipment!.id);
        if (index > -1) {
          const [el] = sorted.splice(index, 1);
          sorted.unshift(el);
        }
      }

      const currency: "USD" | "EUR" | "MXN" =
        (divisa as "USD" | "EUR" | "MXN") || "MXN";

      const options: QuoteOption[] = [];
      
      // Filter logic:
      // If loadType is selected, we ONLY show that option for the selected equipment (if valid)
      // If no loadType, we default to previous behavior (show first 2 options)
      
      let itemsToProcess = [];
      if (selectedEquipment) {
        itemsToProcess = [selectedEquipment];
      } else {
        itemsToProcess = sorted.slice(0, 2);
      }

      for (const eq of itemsToProcess) {
        // Determine tariff type based on user selection or default logic
        // If user selected a specific loadType, we use that. 
        // Otherwise, we fallback to the equipment's default type.
        let tariffTypeToUse: string = loadType ? loadType : eq.tariff_type;
        
        let basePrice = 0;

        if (tariffTypeToUse === "rabon") {
          basePrice = tarifa.rabon;
        } else if (tariffTypeToUse === "sencillo") {
          basePrice = tarifa.sencillo;
        } else if (tariffTypeToUse === "sencillo_sobrepeso") {
          basePrice = tarifa.sencillo_sobrepeso;
        } else if (tariffTypeToUse === "full") {
          basePrice = tarifa.full;
        } else if (tariffTypeToUse === "full_sobrepeso") {
          basePrice = tarifa.full_sobrepeso;
        }

        // Only add if we found a valid price (or if we want to show 0/unavailable)
        // For now, let's assume if price is 0/undefined it might be invalid for that route, but we show it.
        // Better: check if basePrice is valid.
        
        if (basePrice !== undefined && basePrice !== null) {
            options.push({
              equipmentName: eq.name,
              tariffType: tariffTypeToUse, 
              basePrice,
              currency,
            });
        }
      }

      if (!options.length) {
        setQuoteError("No se pudo calcular una tarifa para la configuración seleccionada.");
        return;
      }

      setQuoteOptions(options);
      
      // We prepare the ticket data, but DO NOT show it automatically.
      const selectedOption = options[0];
      setTicketData({
        ...selectedOption,
        empresa,
        emitente,
        fechaExpedicion: diaExpedicion,
        fechaVigencia: diaVigencia,
        folio: numeroCotizacion,
        origen: searchedOrigen || origen, // Ensure we have a value
        destino: searchedDestino || destino, // Ensure we have a value
        items: cargoItems,
        tipoCarga: loadType || selectedOption.tariffType,
        tipoServicio: selectedOption.equipmentName,
        nombreCliente: nombreCliente || empresa, // Pass client name if available
        tiempoCargaDescarga: tiempoCargaDescarga, // New field
        precioTolva: precioTolva // New field
      });
      // setShowTicket(true); // Removed auto-switch
      
    } finally {
      setQuoteLoading(false);
    }
  };

  const hasRoute = searchedOrigen && searchedDestino;

  const mapUrl =
    mapsApiKey && hasRoute
      ? `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(
          searchedOrigen
        )}&destination=${encodeURIComponent(searchedDestino)}&mode=driving`
      : mapsApiKey
        ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent("Mexico")}`
        : `https://www.google.com/maps?q=${encodeURIComponent("Mexico")}&output=embed`;

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
               // Logic to save quote to Supabase
               if (!supabase) {
                 alert("Error: Cliente Supabase no disponible.");
                 return;
               }
               
               const quoteToSave = {
                 folio: ticketData.folio,
                 cliente_nombre: ticketData.nombreCliente || ticketData.empresa, // Fallback if name is empty
                 empresa_nombre: typeof ticketData.empresa === 'string' ? ticketData.empresa : ticketData.empresa?.name,
                 fecha_expedicion: ticketData.fechaExpedicion,
                 fecha_vigencia: ticketData.fechaVigencia,
                 origen: ticketData.origen,
                 destino: ticketData.destino,
                 monto_total: (ticketData.basePrice || 0) + (ticketData.precioTolva ? parseFloat(ticketData.precioTolva) : 0), // Calculate total
                 divisa: ticketData.divisa || 'MXN',
                 estado: 'pendiente',
                 items: ticketData.items,
                 emitente: ticketData.emitente,
                 tipo_servicio: ticketData.tipoServicio,
                 detalles_adicionales: {
                    tiempoCargaDescarga: ticketData.tiempoCargaDescarga,
                    precioTolva: ticketData.precioTolva,
                    tipoCarga: ticketData.tipoCarga
                 }
               };

               try {
                 const { error } = await supabase
                   .from('cotizaciones')
                   .insert([quoteToSave]);
                 
                 if (error) {
                   console.error("Error guardando cotización:", error);
                   alert("Error al guardar la cotización: " + error.message);
                 } else {
                   alert("Cotización guardada exitosamente en el historial.");
                 }
               } catch (err: any) {
                 console.error("Error inesperado:", err);
                 alert("Error inesperado al guardar.");
               }
            }}>
              Guardar Cotización
            </Button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Render PDF Component for Print/View */}
          <PDFCotizacion data={ticketData} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Cotización - Carga general
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Completa los datos para generar una cotización de carga general.
          </p>
        </div>
        <div className="flex gap-2">
           {ticketData && (
             <Button 
                onClick={() => setShowTicket(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
             >
                <FileText className="w-4 h-4 mr-2" />
                Ver Ticket
             </Button>
           )}
           <Button variant="outline" size="sm" onClick={clearDraft} className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar
           </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Empresa Selector */}
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

                  {/* Nombre Cliente Input */}
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
                      onChange={(event) => setEmitente(event.target.value)}
                      placeholder="Nombre de quien emite la cotización"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="diaExpedicion">Fecha de Expedición</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        id="diaExpedicion"
                        type="date"
                        className="pl-10 h-11 border-gray-200 bg-white hover:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        value={diaExpedicion}
                        onChange={(event) => setDiaExpedicion(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diaVigencia">Fecha de Vigencia</Label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        id="diaVigencia"
                        type="date"
                        className="pl-10 h-11 border-gray-200 bg-white hover:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        value={diaVigencia}
                        onChange={(event) => setDiaVigencia(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroCotizacion">No. Cotización</Label>
                    <Input
                      id="numeroCotizacion"
                      className="h-11 border-gray-200 bg-white hover:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all"
                      value={numeroCotizacion}
                      onChange={(event) => setNumeroCotizacion(event.target.value)}
                      placeholder="Ej. COT-0001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tipo de Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="servicio">Servicio / Equipo</Label>
                    <Select
                      value={servicioSeleccionado}
                      onValueChange={(value) => setServicioSeleccionado(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingServices ? (
                          <SelectItem value="loading" disabled>
                            Cargando servicios...
                          </SelectItem>
                        ) : servicesError ? (
                          <SelectItem value="error" disabled>
                            Error: {servicesError}
                          </SelectItem>
                        ) : availableServices.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No hay servicios disponibles
                          </SelectItem>
                        ) : (
                          availableServices.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Servicios cargados: {availableServices.length}
                      {availableServices.length > 0 && ` (Ejemplo: ${availableServices[0].name})`}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loadType">Tipo de Carga</Label>
                    <Select
                      value={loadType}
                      onValueChange={(value) => setLoadType(value as LoadType)}
                      disabled={!selectedService}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={!selectedService ? "Selecciona un servicio primero" : "Selecciona tipo de carga"} />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedLoadTypes.includes("full") && <SelectItem value="full">Full</SelectItem>}
                        {allowedLoadTypes.includes("sencillo") && <SelectItem value="sencillo">Sencillo</SelectItem>}
                        {allowedLoadTypes.includes("full_sobrepeso") && <SelectItem value="full_sobrepeso">Full (Sobrepeso)</SelectItem>}
                        {allowedLoadTypes.includes("sencillo_sobrepeso") && <SelectItem value="sencillo_sobrepeso">Sencillo (Sobrepeso)</SelectItem>}
                        {allowedLoadTypes.includes("rabon") && <SelectItem value="rabon">Rabon</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-gray-100">
                  {/* Tiempo de Carga/Descarga */}
                  <div className="space-y-2">
                    <Label htmlFor="tiempoCarga">Tiempo Carga/Descarga</Label>
                    <Select
                      value={tiempoCargaDescarga}
                      onValueChange={(value) => setTiempoCargaDescarga(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 Horas</SelectItem>
                        <SelectItem value="12">12 Horas (Estándar)</SelectItem>
                        <SelectItem value="24">24 Horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Precio Tolva */}
                  <div className="space-y-2">
                    <Label htmlFor="precioTolva">Precio Tolva (por ton/viaje)</Label>
                    <div className="flex gap-2">
                       {/* Selector de Tolvas */}
                       <Select
                          value={selectedTolva}
                          onValueChange={(value) => setSelectedTolva(value)}
                       >
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Tipo de Tolva" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">Ninguna / Manual</SelectItem>
                           {tolvas.map((t) => (
                             <SelectItem key={t.id} value={t.id}>
                               {t.nombre}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>

                       <Input
                          id="precioTolva"
                          type="number"
                          placeholder="Precio"
                          value={precioTolva}
                          onChange={(e) => setPrecioTolva(e.target.value)}
                          className="w-24"
                       />
                    </div>
                    <p className="text-[10px] text-gray-500">Selecciona un tipo de tolva para autocompletar precio o escribe manual.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Detalles de la carga</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addCargoItem}
                  className="h-8 gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Agregar otra carga
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {cargoItems.map((item, index) => (
                    <div key={item.id} className="relative space-y-4 rounded-lg border border-gray-100 p-4 pt-6">
                      <div className="absolute left-3 top-[-10px] bg-white px-2 text-xs font-medium text-gray-500">
                        Carga #{index + 1}
                      </div>
                      
                      {cargoItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => removeCargoItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                        <div className="space-y-2">
                          <Label htmlFor={`cantidad-${item.id}`}>Cantidad</Label>
                          <Input
                            id={`cantidad-${item.id}`}
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidad}
                            onChange={(e) => updateCargoItem(item.id, "cantidad", e.target.value)}
                            placeholder="Piezas"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`largo-${item.id}`}>Largo (m)</Label>
                          <Input
                            id={`largo-${item.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.largo}
                            onChange={(e) => updateCargoItem(item.id, "largo", e.target.value)}
                            placeholder="m"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`ancho-${item.id}`}>Ancho (m)</Label>
                          <Input
                            id={`ancho-${item.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.ancho}
                            onChange={(e) => updateCargoItem(item.id, "ancho", e.target.value)}
                            placeholder="m"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`alto-${item.id}`}>Alto (m)</Label>
                          <Input
                            id={`alto-${item.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.alto}
                            onChange={(e) => updateCargoItem(item.id, "alto", e.target.value)}
                            placeholder="m"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`peso-${item.id}`}>Peso Unit. (tons)</Label>
                          <Input
                            id={`peso-${item.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.peso}
                            onChange={(e) => updateCargoItem(item.id, "peso", e.target.value)}
                            placeholder="tons"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 pt-2 border-t border-gray-100">
                  <div className="space-y-2">
                    <Label className="text-gray-500">Peso Total del Embarque</Label>
                    <div className="flex items-center h-10 px-3 rounded-md bg-gray-50 border border-gray-200 font-semibold text-gray-900">
                      {totalPeso.toFixed(2)} tons
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">Volumen Total del Embarque</Label>
                    <div className="flex items-center h-10 px-3 rounded-md bg-gray-50 border border-gray-200 font-semibold text-gray-900">
                      {totalVolumen.toFixed(2)} m³
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Divisa</Label>
                    <Select
                      value={divisa}
                      onValueChange={(value) => setDivisa(value as "USD" | "EUR" | "MXN")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Divisa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 h-full flex flex-col">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-base">Origen y destino</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="origen">Origen</Label>
                    <Input
                      id="origen"
                      value={origen}
                      onChange={(event) => setOrigen(event.target.value)}
                      placeholder="Ciudad, estado o dirección"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destino">Destino</Label>
                    <Input
                      id="destino"
                      value={destino}
                      onChange={(event) => setDestino(event.target.value)}
                      placeholder="Ciudad, estado o dirección"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!origen.trim() || !destino.trim()}
                >
                  Mostrar en mapa y Calcular Tarifa
                </Button>

                <div className="mt-2 text-xs text-gray-500">
                  {hasRoute && (
                    <span>
                      Mostrando ruta de <span className="font-semibold">{searchedOrigen}</span> a{" "}
                      <span className="font-semibold">{searchedDestino}</span>.
                    </span>
                  )}
                  {!hasRoute && (
                    <span>
                      Ingresa origen y destino y haz clic en &quot;Mostrar en mapa&quot; para ver la ruta.
                    </span>
                  )}
                </div>

                <div className="mt-2 flex-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 min-h-[400px]">
                  <iframe
                    key={mapUrl}
                    src={mapUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Resultados de la cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quoteLoading && (
                <p className="text-sm text-gray-500">Calculando cotización…</p>
              )}

              {quoteError && !quoteLoading && (
                <div className="space-y-4">
                  <p className="text-sm text-red-500 font-medium">{quoteError}</p>
                  
                  {/* Manual Tariff Entry Fallback */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                     <div className="flex items-start gap-2">
                       <div className="mt-0.5 text-amber-600">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                       </div>
                       <div>
                         <h4 className="text-sm font-semibold text-amber-800">No existe tarifa registrada</h4>
                         <p className="text-xs text-amber-700 mt-1">
                           No encontramos una tarifa automática para esta ruta. Puedes ingresar el costo manualmente para generar el ticket.
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex gap-2 items-end mt-2">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="manualPrice" className="text-xs">Costo del Flete ({divisa})</Label>
                          <Input 
                             id="manualPrice"
                             type="number" 
                             placeholder="0.00" 
                             className="h-8 text-sm bg-white"
                             onChange={(e) => {
                                // We'll store this in a temporary state or just pass it directly if we had a state
                                // For simplicity, let's create a quick state for manual price override
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                   // Update options manually
                                   const newOption: QuoteOption = {
                                      equipmentName: servicioSeleccionado ? 
                                        (availableServices.find(s => s.id === servicioSeleccionado)?.name || "Flete Dedicado") 
                                        : "Flete Dedicado",
                                      tariffType: loadType || "Manual",
                                      basePrice: val,
                                      currency: divisa as any
                                   };
                                   setQuoteOptions([newOption]);
                                } else {
                                   setQuoteOptions([]);
                                }
                             }}
                           />
                        </div>
                        <Button 
                           type="button"
                           size="sm"
                           className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
                           onClick={() => {
                              // If we have options (set by input above), clear error and let user proceed
                              if (quoteOptions.length > 0) {
                                 setQuoteError(null);
                                 // Trigger ticket view generation
                                 const selectedOption = quoteOptions[0];
                                 setTicketData({
                                   ...selectedOption,
                                   empresa,
                                   emitente,
                                   fechaExpedicion: diaExpedicion,
                                   fechaVigencia: diaVigencia,
                                   folio: numeroCotizacion,
                                   origen: searchedOrigen || origen,
                                   destino: searchedDestino || destino,
                                   items: cargoItems,
                                   tipoCarga: loadType || "Manual",
                                   tipoServicio: "Flete Dedicado (Manual)"
                                 });
                                 setShowTicket(true);
                              }
                           }}
                           disabled={quoteOptions.length === 0}
                        >
                           Usar esta tarifa
                        </Button>
                     </div>
                  </div>
                </div>
              )}

              {!quoteLoading && !quoteError && quoteOptions.length === 0 && (
                <p className="text-sm text-gray-500">
                  Completa el formulario y presiona &quot;Mostrar en mapa&quot; para ver
                  opciones de equipos y tarifas.
                </p>
              )}

              {!quoteLoading && !quoteError && quoteOptions.length > 0 && (
                <div className="space-y-3">
                  {quoteOptions.map((option, index) => (
                    <div
                      key={option.equipmentName + index}
                      className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {option.equipmentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Tipo de unidad: {option.tariffType.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {option.currency}{" "}
                          {option.basePrice.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Tarifa base desde tarifario
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
