import { NextResponse } from "next/server";

interface GoogleDistance {
  value: number;
  text: string;
}

interface GoogleDuration {
  value: number;
  text: string;
}

interface GoogleLeg {
  distance: GoogleDistance;
  duration: GoogleDuration;
}

interface GoogleRoute {
  legs: GoogleLeg[];
}

interface GoogleDirectionsResponse {
  status: string;
  routes?: GoogleRoute[];
  error_message?: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.searchParams.get("origin");
    const destination = url.searchParams.get("destination");

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "Parámetros origin y destination son requeridos" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key no configurada en el servidor" },
        { status: 500 },
      );
    }

    const directionsUrl = new URL(
      "https://maps.googleapis.com/maps/api/directions/json",
    );
    directionsUrl.searchParams.set("origin", origin);
    directionsUrl.searchParams.set("destination", destination);
    directionsUrl.searchParams.set("mode", "driving");
    directionsUrl.searchParams.set("language", "es");
    directionsUrl.searchParams.set("region", "mx");
    directionsUrl.searchParams.set("key", apiKey);

    const response = await fetch(directionsUrl.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al consultar Google Directions API" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as GoogleDirectionsResponse;

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      const message = data.error_message || data.status || "Respuesta inválida";
      return NextResponse.json(
        { error: `Error en Google Directions API: ${message}` },
        { status: 502 },
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const distanceMeters = leg.distance.value;
    const durationSeconds = leg.duration.value;
    const distanceKm = distanceMeters / 1000;

    return NextResponse.json({
      distanceKm: Number(distanceKm.toFixed(1)),
      distanceText: leg.distance.text,
      durationText: leg.duration.text,
      raw: {
        distanceMeters,
        durationSeconds,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Error interno calculando la ruta";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
