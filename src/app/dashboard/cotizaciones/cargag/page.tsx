"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { supabase } from "@/lib/supabaseClient";

type CompanySelectionMode = "manual" | "company" | "client";

interface SimpleCompany {
  id: string;
  name: string;
}

interface SimpleClient {
  id: string;
  name: string;
  company?: string;
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
  tariffType: TariffType;
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
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState("");
  const [companySelectionMode, setCompanySelectionMode] = useState<CompanySelectionMode>("manual");

  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
    if (!db) return;

    const load = async () => {
      try {
        const companiesQuery = query(collection(db!, "companies"), orderBy("name", "asc"));
        const companiesSnap = await getDocs(companiesQuery);
        const companiesData: SimpleCompany[] = companiesSnap.docs
          .map((docSnap) => {
            const data = docSnap.data() as any;
            return {
              id: docSnap.id,
              name: data.name || "",
            };
          })
          .filter((c) => c.name);

        const clientsQuery = query(collection(db!, "clients"), orderBy("name", "asc"));
        const clientsSnap = await getDocs(clientsQuery);
        const clientsData: SimpleClient[] = clientsSnap.docs
          .map((docSnap) => {
            const data = docSnap.data() as any;
            return {
              id: docSnap.id,
              name: data.name || "",
              company: data.company || "",
            };
          })
          .filter((c) => c.name);

        setCompanies(companiesData);
        setClients(clientsData);
      } catch (error) {
        console.error("Error loading companies/clients for quotes:", error);
      }
    };

    load();
  }, []);

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

      const tarifasRes = await fetch("/api/tarifas");
      if (!tarifasRes.ok) {
        setQuoteError("No se pudieron obtener las tarifas.");
        return;
      }
      const tarifasData = (await tarifasRes.json()) as TariffRow[];

      const normalize = (text: string) =>
        (text || "")
          .toString()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

      const origenNorm = normalize(origenTexto);
      const destinoNorm = normalize(destinoTexto);

      const matchingTariffs = tarifasData.filter((t) => {
        const tOrigen = normalize(t.origen);
        const tDestino = normalize(t.destino);
        const matchDirect =
          tOrigen.includes(origenNorm) && tDestino.includes(destinoNorm);
        const matchReverse =
          tOrigen.includes(destinoNorm) && tDestino.includes(origenNorm);
        return matchDirect || matchReverse;
      });

      if (!matchingTariffs.length) {
        setQuoteError("No se encontró una tarifa para ese origen y destino.");
        return;
      }

      const tarifa = matchingTariffs[0];

      if (!supabase) {
        setQuoteError("Supabase no está configurado para consultar carga general.");
        return;
      }

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

      for (const eq of sorted.slice(0, 2)) {
        const tariffType = eq.tariff_type;
        let basePrice = 0;

        if (tariffType === "rabon") {
          basePrice = tarifa.rabon;
        } else if (tariffType === "sencillo") {
          basePrice = tarifa.sencillo;
        } else if (tariffType === "full") {
          basePrice = tarifa.full;
        }

        options.push({
          equipmentName: eq.name,
          tariffType,
          basePrice,
          currency,
        });
      }

      if (!options.length) {
        setQuoteError("No se pudo calcular una tarifa para los equipos seleccionados.");
        return;
      }

      setQuoteOptions(options);
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Cotización - Carga general
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Completa los datos para generar una cotización de carga general.
        </p>
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
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa / Cliente</Label>
                    <div className="space-y-2">
                      <div className="grid gap-2 md:grid-cols-2">
                        <Select
                          value={companySelectionMode}
                          onValueChange={(value) =>
                            setCompanySelectionMode(value as CompanySelectionMode)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona origen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Escribir manualmente</SelectItem>
                            <SelectItem value="company">Empresa existente</SelectItem>
                            <SelectItem value="client">Cliente existente</SelectItem>
                          </SelectContent>
                        </Select>

                        {companySelectionMode === "company" && (
                          <Select
                            onValueChange={(value) => setEmpresa(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona empresa" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.name}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {companySelectionMode === "client" && (
                          <Select
                            onValueChange={(value) => setEmpresa(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem
                                  key={client.id}
                                  value={client.company || client.name}
                                >
                                  {client.name}
                                  {client.company ? ` - ${client.company}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <Input
                        id="empresa"
                        value={empresa}
                        onChange={(event) => setEmpresa(event.target.value)}
                        placeholder="Nombre de la empresa o cliente"
                        required
                      />
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
                    <Label htmlFor="diaExpedicion" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Fecha de Expedición
                    </Label>
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
                    <Label htmlFor="diaVigencia" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Fecha de Vigencia (+45 días)
                    </Label>
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
                    <Label htmlFor="numeroCotizacion" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      No. Cotización
                    </Label>
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
                <div className="space-y-2 pb-2 border-b border-gray-100">
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
                  {/* Debug info - Remove in production */}
                  <div className="text-[10px] text-gray-400 mt-1">
                    Servicios cargados: {availableServices.length}
                    {availableServices.length > 0 && ` (Ejemplo: ${availableServices[0].name})`}
                  </div>
                </div>

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

          <div className="space-y-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Origen y destino</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  className="w-full"
                  disabled={!origen.trim() || !destino.trim()}
                >
                  Mostrar en mapa
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

                <div className="mt-2 h-64 md:h-80 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
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
                <p className="text-sm text-red-500">{quoteError}</p>
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
