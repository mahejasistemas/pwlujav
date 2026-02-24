"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Boxes, Layers, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CotizacionesPage() {
  const cards = [
    {
      id: "carga-general",
      title: "Carga general",
      description: "Mercancía suelta o paletizada sin contenedor.",
      Icon: Package,
      accent: "text-teal-600",
      bg: "bg-teal-50",
      href: "/dashboard/cotizaciones/cargag",
    },
    {
      id: "carga-contenedorizada",
      title: "Carga contenerizada",
      description: "Operaciones por contenedor completo o consolidado.",
      Icon: Boxes,
      accent: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/dashboard/cotizaciones/cargacont",
    },
    {
      id: "carga-mixta",
      title: "Carga mixta",
      description: "Combinación de modalidades según necesidad.",
      Icon: Layers,
      accent: "text-amber-600",
      bg: "bg-amber-50",
      href: "/dashboard/cotizaciones/cargamix",
    },
    {
      id: "maritimo",
      title: "Marítimo",
      description: "Servicios y cotizaciones del transporte marítimo.",
      Icon: Ship,
      accent: "text-sky-600",
      bg: "bg-sky-50",
      href: "/dashboard/cotizaciones/maritino",
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Cotizaciones</h2>
      </div>
      <p className="text-sm text-gray-600">
        Selecciona el tipo de carga para iniciar una cotización.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ id, title, description, Icon, accent, bg, href }) => (
          <Card
            key={id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-6 w-6 ${accent}`} />
                </div>
                <div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="text-sm text-gray-500">
                  Disponible para cotizar.
                </div>
                <Button asChild className="w-full">
                  <Link href={href}>
                    Cotizar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
