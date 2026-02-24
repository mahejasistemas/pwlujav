"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CpPage() {
  const [origenCp, setOrigenCp] = useState("");
  const [destinoCp, setDestinoCp] = useState("");
  const [searchedOrigenCp, setSearchedOrigenCp] = useState("");
  const [searchedDestinoCp, setSearchedDestinoCp] = useState("");
  const [distanceKm, setDistanceKm] = useState(null);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const origen = origenCp.trim();
    const destino = destinoCp.trim();
    if (!origen || !destino) return;
    setSearchedOrigenCp(origen);
    setSearchedDestinoCp(destino);

    setLoadingRoute(true);
    setRouteError("");
    setDistanceKm(null);
    setDistanceText("");
    setDurationText("");

    try {
      const params = new URLSearchParams({
        origin: `${origen} Mexico`,
        destination: `${destino} Mexico`,
      });
      const response = await fetch(`/api/directions?${params.toString()}`);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          (data && data.error) || "No se pudo obtener la ruta desde el servidor.";
        setRouteError(message);
        return;
      }

      setDistanceKm(
        typeof data.distanceKm === "number" ? data.distanceKm : null,
      );
      setDistanceText(data.distanceText || "");
      setDurationText(data.durationText || "");
    } catch (error) {
      console.error(error);
      setRouteError("No se pudo calcular el kilometraje de la ruta.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const hasRoute = searchedOrigenCp && searchedDestinoCp && !routeError;

  const mapUrl =
    mapsApiKey && hasRoute
      ? `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(
          `${searchedOrigenCp} Mexico`,
        )}&destination=${encodeURIComponent(
          `${searchedDestinoCp} Mexico`,
        )}&mode=driving`
      : mapsApiKey
        ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent("Mexico")}`
        : `https://www.google.com/maps?q=${encodeURIComponent("Mexico")}&output=embed`;

  return (
    <div className="h-full">
      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-full max-w-xs border-r border-gray-200 bg-white p-4 sm:p-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Códigos postales</h1>
            <p className="text-xs text-muted-foreground">
              Define origen y destino para ver la zona en el mapa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Origen (CP)
                </label>
                <input
                  value={origenCp}
                  onChange={(event) => setOrigenCp(event.target.value)}
                  placeholder="Ej. 64000"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Destino (CP)
                </label>
                <input
                  value={destinoCp}
                  onChange={(event) => setDestinoCp(event.target.value)}
                  placeholder="Ej. 64000"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10"
              disabled={!origenCp.trim() || !destinoCp.trim()}
            >
              Mostrar en mapa
            </Button>
          </form>

          {searchedOrigenCp && searchedDestinoCp && (
            <p className="text-xs text-muted-foreground">
              Mostrando ruta de{" "}
              <span className="font-semibold">{searchedOrigenCp}</span> a{" "}
              <span className="font-semibold">{searchedDestinoCp}</span>.
            </p>
          )}

          {loadingRoute && (
            <p className="text-xs text-muted-foreground mt-2">
              Calculando distancia y tiempo…
            </p>
          )}

          {routeError && (
            <p className="text-xs text-red-500 mt-2">
              {routeError}
            </p>
          )}

          {!loadingRoute && !routeError && distanceKm !== null && durationText && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-gray-200 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-500 uppercase">
                  Distancia
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {distanceText}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-500 uppercase">
                  Duración
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {durationText}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-gray-100">
          <div className="w-full h-full">
            <iframe
              key={mapUrl}
              src={mapUrl}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
