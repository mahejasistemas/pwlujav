"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

interface GeneralCargoEquipment {
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

export default function CargaGeneralPage() {
  const [empresa, setEmpresa] = useState("");
  const [diaExpedicion, setDiaExpedicion] = useState("");
  const [diaVigencia, setDiaVigencia] = useState("");
  const [emitente, setEmitente] = useState("");
  const [numeroCotizacion, setNumeroCotizacion] = useState("");

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [searchedOrigen, setSearchedOrigen] = useState("");
  const [searchedDestino, setSearchedDestino] = useState("");

  const [largo, setLargo] = useState("");
  const [alto, setAlto] = useState("");
  const [ancho, setAncho] = useState("");
  const [peso, setPeso] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [divisa, setDivisa] = useState<"USD" | "EUR" | "MXN" | "">("");

  const [companies, setCompanies] = useState<SimpleCompany[]>([]);
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [companySelectionMode, setCompanySelectionMode] = useState<CompanySelectionMode>("manual");

  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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

      const largoNum = parseFloat(largo) || 0;
      const altoNum = parseFloat(alto) || 0;
      const anchoNum = parseFloat(ancho) || 0;
      const pesoNum = parseFloat(peso) || 0;

      if (!largoNum || !anchoNum || !altoNum || !pesoNum) {
        setQuoteError("Debes completar las medidas y el peso para cotizar.");
        return;
      }

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

      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from("carga_general")
        .select("*");

      if (equipmentsError) {
        setQuoteError("No se pudieron obtener los equipos de carga general.");
        return;
      }

      const equipments = (equipmentsData || []) as GeneralCargoEquipment[];

      const candidates = equipments.filter((eq) => {
        const largoMax = eq.largo || 0;
        const anchoMax = eq.ancho || 0;
        const altoMax = eq.alto || 0;
        const pesoMax = eq.peso_max || 0;

        const fitsLargo = !largoMax || largoNum <= largoMax;
        const fitsAncho = !anchoMax || anchoNum <= anchoMax;
        const fitsAlto = !altoMax || altoNum <= altoMax;
        const fitsPeso = !pesoMax || pesoNum <= pesoMax;

        return fitsLargo && fitsAncho && fitsAlto && fitsPeso;
      });

      if (!candidates.length) {
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
                    <Label htmlFor="diaExpedicion">Día de expedición</Label>
                    <Input
                      id="diaExpedicion"
                      type="date"
                      value={diaExpedicion}
                      onChange={(event) => setDiaExpedicion(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diaVigencia">Día de vigencia</Label>
                    <Input
                      id="diaVigencia"
                      type="date"
                      value={diaVigencia}
                      onChange={(event) => setDiaVigencia(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroCotizacion">No. Cotización</Label>
                    <Input
                      id="numeroCotizacion"
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
                <CardTitle className="text-base">Detalles de la carga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label htmlFor="largo">Largo</Label>
                    <Input
                      id="largo"
                      type="number"
                      min="0"
                      step="0.01"
                      value={largo}
                      onChange={(event) => setLargo(event.target.value)}
                      placeholder="m"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alto">Alto</Label>
                    <Input
                      id="alto"
                      type="number"
                      min="0"
                      step="0.01"
                      value={alto}
                      onChange={(event) => setAlto(event.target.value)}
                      placeholder="m"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ancho">Ancho</Label>
                    <Input
                      id="ancho"
                      type="number"
                      min="0"
                      step="0.01"
                      value={ancho}
                      onChange={(event) => setAncho(event.target.value)}
                      placeholder="m"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (tons)</Label>
                    <Input
                      id="peso"
                      type="number"
                      min="0"
                      step="0.01"
                      value={peso}
                      onChange={(event) => setPeso(event.target.value)}
                      placeholder="tons"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      step="1"
                      value={cantidad}
                      onChange={(event) => setCantidad(event.target.value)}
                      placeholder="Piezas"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label>Tipo de Divisa</Label>
                  <Select
                    value={divisa}
                    onValueChange={(value) => setDivisa(value as "USD" | "EUR" | "MXN")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una divisa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                    </SelectContent>
                  </Select>
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
