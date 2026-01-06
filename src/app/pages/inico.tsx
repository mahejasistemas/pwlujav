"use client";

import { 
  Users, 
  Package, 
  Truck, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  MoreHorizontal,
  MapPin,
  Calendar
} from "lucide-react";

export default function InicioPage() {
  const stats = [
    { 
      title: "Envíos Activos", 
      value: "24", 
      icon: Package, 
      trend: "up", 
      change: "+12%",
      bg: "bg-blue-50",
      color: "text-blue-600"
    },
    { 
      title: "Flota Disponible", 
      value: "8/12", 
      icon: Truck, 
      trend: "neutral", 
      change: "66%",
      bg: "bg-purple-50",
      color: "text-purple-600"
    },
    { 
      title: "Conductores", 
      value: "15", 
      icon: Users, 
      trend: "up", 
      change: "+2",
      bg: "bg-green-50",
      color: "text-green-600"
    },
    { 
      title: "Alertas", 
      value: "3", 
      icon: AlertCircle, 
      trend: "down", 
      change: "-1",
      bg: "bg-red-50",
      color: "text-red-600"
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-sm text-gray-500 mt-1">Bienvenido a Transportes Lujav</p>
          </div>
          <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
            <TrendingUp className="h-4 w-4" />
            Nuevo Envío
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend === "up" ? "bg-green-50 text-green-700" : 
                  stat.trend === "down" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Shipments */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Envíos Recientes</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Envío #TR-{2024000 + i}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Lima → Arequipa</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Hoy, 14:30</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      En Tránsito
                    </span>
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-left">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Cotizar Envío</div>
                    <div className="text-xs text-gray-500">Calcula tarifas al instante</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-left">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Registrar Cliente</div>
                    <div className="text-xs text-gray-500">Añade nueva empresa</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Alertas del Sistema</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Mantenimiento Programado</p>
                    <p className="text-xs text-gray-500 mt-0.5">Unidad V-402 requiere revisión técnica mañana.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Facturas Pendientes</p>
                    <p className="text-xs text-gray-500 mt-0.5">3 facturas vencen esta semana.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}