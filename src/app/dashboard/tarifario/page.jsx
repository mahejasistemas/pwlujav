"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";

/**
 * @typedef {Object} TariffRow
 * @property {string} id
 * @property {string} origen
 * @property {string} destino
 * @property {number} rabon
 * @property {number} sencillo
 * @property {number} sencillo_sobrepeso
 * @property {number} full
 * @property {number} full_sobrepeso
 */

const CITIES = [
  {
    id: "manzanillo",
    name: "Manzanillo",
    subtitle: "Manzanillo, Colima",
    description: "Puerto de Manzanillo, Colima.",
    logoUrl: "https://i.imgur.com/uSLtnQV.png",
    table: "manzanillo"
  },
  {
    id: "veracruz",
    name: "Veracruz",
    subtitle: "Veracruz, Veracruz",
    description: "Puerto de Veracruz, Veracruz.",
    logoUrl: "https://i.imgur.com/jgqrxQ0.png",
    table: "veracruz"
  },
  {
    id: "altamira",
    name: "Altamira",
    subtitle: "Altamira, Tamaulipas",
    description: "Puerto de Altamira, Tamaulipas.",
    logoUrl: "https://i.imgur.com/QDvwpMg.png",
    table: "altamira"
  },
];

export default function TarifarioPage() {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [cityCounts, setCityCounts] = useState({});

  useEffect(() => {
    // Load counts for each city
    const loadCounts = async () => {
      const counts = {};
      for (const city of CITIES) {
        if (!supabase) {
          console.error("Supabase client is not available");
          continue;
        }
        
        try {
          const { count, error } = await supabase
            .from(city.table)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.error(`Error loading count for ${city.name}:`, error);
          } else {
            counts[city.id] = count;
          }
        } catch (err) {
          console.error(`Exception loading count for ${city.name}:`, err);
        }
      }
      setCityCounts(counts);
    };
    loadCounts();
  }, []);

  useEffect(() => {
    if (!selectedCityId) {
      setTariffs([]);
      return;
    }

    const city = CITIES.find(c => c.id === selectedCityId);
    if (!city) return;

    const loadTariffs = async () => {
      setLoading(true);
      setError("");
      
      try {
        if (!supabase) throw new Error("Supabase client not initialized");
        
        const { data, error } = await supabase
          .from(city.table)
          .select('*');

        if (error) throw error;
        
        // Map database columns to UI expected format (handling potential naming differences)
        const mappedData = (data || []).map(item => ({
          id: item.id,
          origen: item.origen,
          destino: item.destino,
          // Support both 'rabon' and 'precio_rabon' formats
          rabon: item.rabon ?? item.precio_rabon,
          sencillo: item.sencillo ?? item.precio_sencillo,
          sencillo_sobrepeso: item.sencillo_sobrepeso ?? item.precio_sencillo_sp,
          full: item.full ?? item.precio_full,
          full_sobrepeso: item.full_sobrepeso ?? item.precio_full_sp
        }));

        setTariffs(mappedData);
      } catch (e) {
        console.error("Load Error:", e);
        setError(`No se pudieron cargar las tarifas de ${city.name}.`);
        setTariffs([]);
      } finally {
        setLoading(false);
      }
    };

    loadTariffs();
  }, [selectedCityId]);

  const selectedCity = useMemo(
    () => CITIES.find((c) => c.id === selectedCityId) || null,
    [selectedCityId],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tarifario</h1>
        <p className="text-sm text-muted-foreground">
          {selectedCity
            ? `Tarifas de ${selectedCity.name}`
            : "Selecciona una plaza para ver sus tarifas."}
        </p>
      </div>

      {!selectedCity && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CITIES.map((city) => (
            <Card
              key={city.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden flex items-center justify-center bg-transparent">
                  {city.logoUrl ? (
                    <img
                      src={city.logoUrl}
                      alt={`Logo ${city.name}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <MapPin className="h-6 w-6 text-[#B80000]" />
                  )}
                </div>
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-[#B80000]" />
                    {city.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{city.subtitle}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="text-sm text-gray-600">{city.description}</p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-center">
                    <div className="text-xs text-gray-500">Tarifas</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {cityCounts[city.id] || 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-center">
                    <div className="text-xs text-gray-500">Base</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {city.name}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-center">
                    <div className="text-xs text-gray-500">Estado</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {error ? "Sin datos" : "Activa"}
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => {
                      setSelectedCityId(city.id);
                    }}
                  >
                    Ver tarifas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCity && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tarifario</p>
              <h2 className="text-lg font-semibold">
                {selectedCity.name}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  - detalle de tarifas
                </span>
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCityId(null);
              }}
            >
              Volver a plazas
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando tarifas…</p>
          ) : error ? (
            <p className="text-sm text-red-500">
              No se pudieron cargar las tarifas.
            </p>
          ) : tariffs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">No hay tarifas registradas</p>
              <p className="text-xs text-gray-500 mt-1">
                La tabla <code>{selectedCity.table}</code> está vacía en Supabase.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Lista de tarifas ({tariffs.length})
                </div>
              </div>
              <ScrollArea className="max-h-[60vh] w-full">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Origen
                      </th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Destino
                      </th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Rabón
                      </th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Sencillo
                      </th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Sencillo SP
                      </th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Full
                      </th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                        Full SP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tariffs.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2 align-middle">
                          <span className="text-xs font-medium text-gray-900">
                            {t.origen}
                          </span>
                        </td>
                        <td className="px-4 py-2 align-middle">
                          <span className="text-xs text-gray-700">
                            {t.destino}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right align-middle font-mono text-[12px] text-gray-900">
                          {t.rabon?.toLocaleString("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          })}
                        </td>
                        <td className="px-4 py-2 text-right align-middle font-mono text-[12px] text-gray-900">
                          {t.sencillo?.toLocaleString("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          })}
                        </td>
                        <td className="px-4 py-2 text-right align-middle font-mono text-[12px] text-gray-900">
                          {t.sencillo_sobrepeso?.toLocaleString("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          })}
                        </td>
                        <td className="px-4 py-2 text-right align-middle font-mono text-[12px] text-gray-900">
                          {t.full?.toLocaleString("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          })}
                        </td>
                        <td className="px-4 py-2 text-right align-middle font-mono text-[12px] text-gray-900">
                          {t.full_sobrepeso?.toLocaleString("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
