"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  ArrowUpDown,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Upload,
  LayoutDashboard,
  Inbox,
  Archive,
  Calendar,
  TrendingUp
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";

interface Quote {
  id: string;
  clientName: string;
  projectName: string;
  date: string;
  amount: number;
  status: "aprobada" | "pendiente" | "rechazada";
  validUntil: string;
  items?: any[]; // To store details from Excel
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function CotizacionesPage() {
  // Quotes state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load quotes from Firebase Realtime
  useEffect(() => {
    const q = query(collection(db, "quotes"), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quotesData: Quote[] = [];
      querySnapshot.forEach((doc) => {
        quotesData.push({ id: doc.id, ...doc.data() } as Quote);
      });
      setQuotes(quotesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching quotes:", error);
      toast.error("No se pudo cargar las cotizaciones.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Create Quote State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState({
    clientName: "",
    projectName: "",
    amount: "",
    status: "pendiente" as "aprobada" | "pendiente" | "rechazada",
    validUntil: "",
    items: [] as any[]
  });

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newQuote = {
        clientName: newQuoteData.clientName,
        projectName: newQuoteData.projectName,
        date: new Date().toLocaleDateString(),
        amount: parseFloat(newQuoteData.amount) || 0,
        status: newQuoteData.status,
        validUntil: newQuoteData.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Default 15 days
        items: newQuoteData.items || []
      };
      
      await addDoc(collection(db, "quotes"), newQuote);
      
      setIsCreateModalOpen(false);
      // Reset form
      setNewQuoteData({
        clientName: "",
        projectName: "",
        amount: "",
        status: "pendiente",
        validUntil: "",
        items: []
      });
      toast.success("Cotización creada exitosamente");
    } catch (error) {
      console.error("Error creating quote:", error);
      toast.error("Error al crear la cotización");
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: Quote['status']) => {
    try {
      const quoteRef = doc(db, "quotes", quoteId);
      await updateDoc(quoteRef, {
        status: newStatus
      });
      toast.success("Estado actualizado");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprobada": return "bg-green-100 text-green-700 border-green-200";
      case "pendiente": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rechazada": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Helper to normalize text for comparison
  const normalizeText = (text: any) => {
    if (!text) return "";
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  // Handle Excel Upload and Processing
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Procesando archivo...");

    try {
      // 1. Read Excel File
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("El archivo Excel está vacío", { id: toastId });
        return;
      }

      // 2. Fetch Tariffs from Firestore
      const tariffsSnapshot = await getDocs(collection(db, "tarifas"));
      const tariffs = tariffsSnapshot.docs.map(doc => doc.data());

      let totalAmount = 0;
      let matches = 0;
      const quoteItems: any[] = [];

      // 3. Match Rows with Tariffs
      jsonData.forEach((row: any) => {
        const keys = Object.keys(row);
        const originKey = keys.find(k => normalizeText(k).includes("origen")) || keys[0]; // Fallback to 1st col
        const destinationKey = keys.find(k => normalizeText(k).includes("destino")) || keys[1]; // Fallback to 2nd col
        
        const origin = row[originKey];
        const destination = row[destinationKey];

        if (origin && destination) {
          const tariff = tariffs.find(t => 
            normalizeText(t.origin) === normalizeText(origin) && 
            normalizeText(t.destination) === normalizeText(destination)
          );

          let price = 0;
          let status = "Sin cobertura";

          if (tariff && tariff.price) {
            price = parseFloat(tariff.price);
            totalAmount += price;
            matches++;
            status = "Cotizado";
          }

          quoteItems.push({
            origin,
            destination,
            price,
            status,
            details: row 
          });
        }
      });

      // 4. Pre-fill Create Modal
      setNewQuoteData(prev => ({
        ...prev,
        amount: totalAmount.toFixed(2),
        projectName: `Cotización Importada (${matches}/${jsonData.length} rutas encontradas)`,
        items: quoteItems
      }));
      
      setIsCreateModalOpen(true);
      toast.success(`Procesado con éxito. ${matches} rutas encontradas.`, { id: toastId });

    } catch (error) {
      console.error("Error processing Excel:", error);
      toast.error("Error al procesar el archivo Excel", { id: toastId });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Calculate stats
  const pendingQuotes = quotes.filter(q => q.status === "pendiente").length;
  const approvedQuotes = quotes.filter(q => q.status === "aprobada").length;
  const rejectedQuotes = quotes.filter(q => q.status === "rechazada").length;
  
  // Dashboard Stats Logic
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const thisMonthQuotes = quotes.filter(q => {
    if (!q.date) return false;
    // Try to parse DD/MM/YYYY
    const parts = q.date.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return month === currentMonth && year === currentYear;
    }
    return false;
  });

  const thisMonthAmount = thisMonthQuotes.reduce((acc, q) => acc + (q.amount || 0), 0);
  const totalAmount = quotes.reduce((acc, q) => acc + (q.amount || 0), 0);
  
  // Filter quotes for display
  const filteredQuotes = quotes.filter(q => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return q.status === 'pendiente';
    if (activeFilter === 'approved') return q.status === 'aprobada';
    if (activeFilter === 'rejected') return q.status === 'rechazada';
    return true;
  });

  return (
    <div className="flex h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* 1. Left Sidebar (Local) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-black" />
            Cotizaciones
          </h2>

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full bg-black text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" />
                Nueva Cotización
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 ml-1">
              <DropdownMenuItem 
                onClick={() => {
                  setNewQuoteData({
                    clientName: "",
                    projectName: "",
                    amount: "",
                    status: "pendiente",
                    validUntil: "",
                    items: []
                  });
                  setIsCreateModalOpen(true);
                }}
                className="cursor-pointer py-3"
              >
                <FileText className="mr-3 h-4 w-4 text-gray-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Manual</span>
                  <span className="text-xs text-gray-500">Formulario desde cero</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer py-3"
              >
                <Upload className="mr-3 h-4 w-4 text-gray-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Importar Excel</span>
                  <span className="text-xs text-gray-500">Carga masiva automática</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Filtros</p>
          
          <button 
            onClick={() => setActiveFilter('all')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              activeFilter === 'all' 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Inbox className="h-4 w-4" />
              Todas
            </div>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{quotes.length}</span>
          </button>

          <button 
            onClick={() => setActiveFilter('pending')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              activeFilter === 'pending' 
                ? "bg-amber-50 text-amber-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              Pendientes
            </div>
            {pendingQuotes > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pendingQuotes}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveFilter('approved')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              activeFilter === 'approved' 
                ? "bg-green-50 text-green-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4" />
              Aprobadas
            </div>
            {approvedQuotes > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{approvedQuotes}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveFilter('rejected')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              activeFilter === 'rejected' 
                ? "bg-red-50 text-red-700" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Archive className="h-4 w-4" />
              Rechazadas
            </div>
            {rejectedQuotes > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{rejectedQuotes}</span>
            )}
          </button>
        </nav>
        
        {/* Footer of Sidebar - Dashboard Stats */}
        <div className="p-4 border-t border-gray-200 space-y-3 bg-gray-50/50">
          
          {/* This Month Stats */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold uppercase">Este Mes</p>
              </div>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {thisMonthQuotes.length} total
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              S/ {thisMonthAmount.toFixed(2)}
            </p>
          </div>

          {/* All Time Stats */}
          <div className="bg-black text-white rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold uppercase">Histórico</p>
              </div>
              <span className="text-[10px] font-medium text-white bg-white/20 px-2 py-0.5 rounded-full">
                {quotes.length} total
              </span>
            </div>
            <p className="text-lg font-bold">
              S/ {totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header Toolbar */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por cliente, proyecto..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowUpDown className="h-4 w-4" />
              Ordenar
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-100">
                <th className="py-4 pl-6 pr-4 text-xs font-semibold text-gray-500 w-1/3">Cliente / Proyecto</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 w-1/6">Fecha</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 w-1/6">Monto</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 w-1/6">Válido Hasta</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 w-1/6 text-center">Estado</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 text-sm">
                    Cargando cotizaciones...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 text-gray-300" />
                      <p>No se encontraron cotizaciones en esta vista.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr 
                    key={quote.id} 
                    className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                          <span className="font-bold text-xs">{quote.clientName.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {quote.clientName}
                          </div>
                          <div className="text-xs text-gray-500">{quote.projectName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">{quote.date}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">S/ {quote.amount.toFixed(2)}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{quote.validUntil}</td>
                    <td className="py-4 px-4">
                      <div 
                        className="flex justify-center" 
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <Select 
                          defaultValue={quote.status}
                          onValueChange={(value) => {
                            updateQuoteStatus(quote.id, value as Quote['status']);
                          }}
                        >
                          <SelectTrigger className={cn(
                            "h-7 text-xs w-[110px] rounded-full border-0 focus:ring-0 focus:ring-offset-0 font-medium",
                            getStatusColor(quote.status)
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprobada">Aprobada</SelectItem>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="rechazada">Rechazada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-gray-300 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* 3. Create Quote Modal (Same as before) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nueva Cotización</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Cliente</label>
                <input 
                  required
                  type="text" 
                  value={newQuoteData.clientName}
                  onChange={(e) => setNewQuoteData({...newQuoteData, clientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                  placeholder="Ej. Juan Pérez / Empresa SAC"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Proyecto / Descripción</label>
                <input 
                  required
                  type="text" 
                  value={newQuoteData.projectName}
                  onChange={(e) => setNewQuoteData({...newQuoteData, projectName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                  placeholder="Ej. Instalación de equipos"
                />
              </div>

              {/* Items Preview if available */}
              {newQuoteData.items && newQuoteData.items.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-2 max-h-40 overflow-y-auto border border-gray-100">
                  <p className="font-semibold text-gray-700">Resumen de Importación ({newQuoteData.items.length} items)</p>
                  {newQuoteData.items.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-600">
                      <span className="truncate max-w-[60%]">{item.origin} → {item.destination}</span>
                      <span className={item.price > 0 ? "text-green-600 font-medium" : "text-red-400"}>
                        {item.price > 0 ? `S/ ${item.price}` : "Sin precio"}
                      </span>
                    </div>
                  ))}
                  {newQuoteData.items.length > 10 && (
                    <p className="text-center text-gray-400 italic pt-1">...y {newQuoteData.items.length - 10} más</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Monto (S/)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={newQuoteData.amount}
                    onChange={(e) => setNewQuoteData({...newQuoteData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Válido Hasta</label>
                  <input 
                    type="date" 
                    value={newQuoteData.validUntil}
                    onChange={(e) => setNewQuoteData({...newQuoteData, validUntil: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Estado Inicial</label>
                <Select 
                  value={newQuoteData.status} 
                  onValueChange={(value: "aprobada" | "pendiente" | "rechazada") => setNewQuoteData({...newQuoteData, status: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobada">Aprobada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Crear Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}