import { NextResponse } from "next/server";

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
        { error: "Google Maps API key no configurada" },
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

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: "No se encontró ruta entre los puntos indicados" },
        { status: 404 },
      );
    }

    const leg = data.routes[0]?.legs?.[0];

    if (!leg || !leg.distance || !leg.duration) {
      return NextResponse.json(
        { error: "Respuesta de ruta incompleta" },
        { status: 500 },
      );
    }

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
    console.error("Error en /api/directions:", error);
    return NextResponse.json(
      { error: "Error interno calculando la ruta" },
      { status: 500 },
    );
  }
}

