import { Quote } from "../types";
import { Badge } from "lucide-react";

interface QuoteListProps {
  quotes: Quote[];
  onSelect: (quote: Quote) => void;
}

export function QuoteList({ quotes, onSelect }: QuoteListProps) {
  return (
    <div className="w-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Cliente / Proyecto
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Fecha
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Monto
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Estado
            </th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {quotes.map((quote) => (
            <tr 
              key={quote.id} 
              className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
              onClick={() => onSelect(quote)}
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{quote.clientName}</span>
                  <span className="text-xs text-gray-500">{quote.projectName}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(quote.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">
                $ {quote.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${quote.status === 'aprobada' ? 'bg-green-100 text-green-800' : 
                    quote.status === 'rechazada' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {quote.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(quote);
                  }}
                >
                  Ver Detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
