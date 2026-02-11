"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  LayoutDashboard, 
  Calendar, 
  TrendingUp,
  Inbox,
  ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

// Components
import { QuoteList } from "./components/QuoteList";
import { CreateQuoteModal } from "./components/CreateQuoteModal";
import { QuoteDetailModal } from "./components/QuoteDetailModal";
import { Quote } from "./types";

export default function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Load Quotes
  useEffect(() => {
    if (!db) {
      console.error("Firebase db is not initialized");
      setLoading(false);
      return;
    }
    const q = query(collection(db, "quotes"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quote));
      setQuotes(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading quotes:", error);
      toast.error("Error al cargar cotizaciones");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredQuotes = quotes.filter(q => {
    const quoteStatus = q.status as string;
    return filter === 'all' || quoteStatus === filter;
  });
  
  // Stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthQuotes = quotes.filter(q => q.date && typeof q.date === 'string' && q.date.startsWith(thisMonth));
  const monthAmount = monthQuotes.reduce((acc, q) => acc + (Number(q.amount) || 0), 0);
  const totalAmount = quotes.reduce((acc, q) => acc + (Number(q.amount) || 0), 0);

  return (
    <div className="flex h-full bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Cotizaciones
          </h1>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/5"
          >
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="capitalize">
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : 'Rechazadas'}
              </span>
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-xs">
                {quotes.filter(q => f === 'all' || q.status === f).length}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Este Mes
              </span>
              <span className="text-xs font-bold text-blue-600">{monthQuotes.length}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">$ {monthAmount.toFixed(2)}</p>
          </div>
          <div className="bg-black p-3 rounded-xl shadow-md text-white">
             <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Total Histórico
              </span>
            </div>
            <p className="text-lg font-bold">$ {totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">
            <ArrowUpDown className="h-4 w-4" /> Ordenar
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Cargando...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Inbox className="h-10 w-10 mb-2" />
              <p>No hay cotizaciones</p>
            </div>
          ) : (
            <QuoteList quotes={filteredQuotes} onSelect={setSelectedQuote} />
          )}
        </div>
      </main>

      {/* Modals */}
      {isCreateOpen && (
        <CreateQuoteModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
        />
      )}

      {selectedQuote && (
        <QuoteDetailModal 
          quote={selectedQuote} 
          onClose={() => setSelectedQuote(null)} 
        />
      )}
    </div>
  );
}
