"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    subtitle: "Manzanillo, Sonora",
    description:
      "Puerto de Manzanillo, Colima.",
    logoUrl: "https://i.imgur.com/uSLtnQV.png",
  },
  {
    id: "veracruz",
    name: "Veracruz",
    subtitle: "Veracruz , Veracruz",
    description:
      "Puerto de Veracruz, Veracruz.",
    logoUrl: "https://i.imgur.com/jgqrxQ0.png",
  },
  {
    id: "altamira",
    name: "Altamira",
    subtitle: "Altamira,Tamaulipas",
    description:
      "Puerto de Altamira, Tamaulipas.",
    logoUrl: "https://i.imgur.com/QDvwpMg.png",
  },
];

export default function TarifarioPage() {
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCityId, setSelectedCityId] = useState(null);

  const normalize = (text) =>
    (text || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/tarifas");
        if (!res.ok) throw new Error("Error cargando tarifas");
        const data = await res.json();
        if (active) setTariffs(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError("No se pudieron cargar las tarifas.");
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const countsByCity = useMemo(() => {
    const result = {};
    CITIES.forEach((c) => {
      result[c.id] = 0;
    });
    tariffs.forEach((t) => {
      const origen = normalize(t.origen);
      CITIES.forEach((c) => {
        const city = normalize(c.name);
        if (origen.includes(city)) {
          result[c.id] = (result[c.id] || 0) + 1;
        }
      });
    });
    return result;
  }, [tariffs]);

  const selectedCity = useMemo(
    () => CITIES.find((c) => c.id === selectedCityId) || null,
    [selectedCityId],
  );

  /** @type {TariffRow[]} */
  const tariffsForSelectedCity = useMemo(() => {
    if (!selectedCity) return [];
    const cityName = normalize(selectedCity.name);
    return tariffs.filter((t) => normalize(t.origen).includes(cityName));
  }, [selectedCity, tariffs]);

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
                      {loading || error ? "–" : countsByCity[city.id] || 0}
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
          ) : tariffsForSelectedCity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay tarifas registradas para esta plaza.
            </p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Lista de tarifas ({tariffsForSelectedCity.length})
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
                    {tariffsForSelectedCity.map((t) => (
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
