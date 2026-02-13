import { Quote } from "../types";
import { X, FileText, Calendar, DollarSign, MapPin, Truck } from "lucide-react";

interface QuoteDetailModalProps {
  quote: Quote;
  onClose: () => void;
}

export function QuoteDetailModal({ quote, onClose }: QuoteDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Detalle de Cotización</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wide">ID: {quote.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Banner */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            quote.status === 'aprobada' ? 'bg-green-50 border-green-100 text-green-700' :
            quote.status === 'rechazada' ? 'bg-red-50 border-red-100 text-red-700' :
            'bg-yellow-50 border-yellow-100 text-yellow-700'
          }`}>
            <span className="font-medium flex items-center gap-2">
              Estado actual: <span className="capitalize font-bold">{quote.status}</span>
            </span>
            <span className="text-sm opacity-80">
              Válida hasta: {new Date(quote.validUntil).toLocaleDateString()}
            </span>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b pb-2">Cliente</h3>
              <div>
                <label className="text-xs text-gray-500">Nombre del Cliente</label>
                <p className="font-medium text-gray-900">{quote.clientName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b pb-2">Logística</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-xs text-gray-500">Origen</label>
                  <p className="text-sm font-medium text-gray-900">{quote.origin || "No especificado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-xs text-gray-500">Destino</label>
                  <p className="text-sm font-medium text-gray-900">{quote.destination || "No especificado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-xs text-gray-500">Vehículo</label>
                  <p className="text-sm font-medium text-gray-900">{quote.vehicleType || "No asignado"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
             <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monto Total</p>
                  <p className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg text-gray-400">$</span>
                    {quote.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    <span className="text-sm text-gray-400 font-normal">MXN</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Fecha de creación</p>
                  <p className="text-sm font-medium text-gray-600">{new Date(quote.date).toLocaleDateString()}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            Editar Cotización
          </button>
        </div>
      </div>
    </div>
  );
}
