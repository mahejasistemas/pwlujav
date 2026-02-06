"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  MapPin, 
  Truck, 
  DollarSign, 
  MoreHorizontal, 
  FileEdit, 
  Trash2,
  Tags,
  Upload,
  Download,
  ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
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

export default function TarifarioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'az' | 'popularity'>('az');
  const [selectedBase, setSelectedBase] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load rates from API (MongoDB)
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/tarifas');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch rates');
      }
      const loadedRates = await response.json();
      
      // Sort in memory to handle mixed field names (origin/origen)
      loadedRates.sort((a: any, b: any) => {
        const originA = a.origen || a.origin || "";
        const originB = b.origen || b.origin || "";
        return originA.localeCompare(originB);
      });

      setRates(loadedRates);
    } catch (error) {
      console.error("Error loading rates:", error);
      toast.error("Error al cargar las tarifas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Por favor, sube un archivo CSV válido");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers: remove BOM, trim, lowercase, replace spaces with underscores
        return header.trim().toLowerCase().replace(/^[\uFEFF]/, "").replace(/\s+/g, "_");
      },
      complete: async (results) => {
        try {
          const parsedData = results.data;
          console.log("Datos parseados:", parsedData); // Debugging
          
          if (parsedData.length === 0) {
            toast.error("El archivo CSV está vacío o no se pudo leer");
            return;
          }

          // Validate first row has required fields (at least origin and destination)
          const firstRow = parsedData[0] as any;
          if (!firstRow.origen || !firstRow.destino) {
            toast.error("El formato del CSV no es correcto. Debe tener columnas 'origen' y 'destino'");
            console.error("Columnas encontradas:", Object.keys(firstRow));
            return;
          }

          const ratesToImport = [];

          // Process rows
          for (const row of parsedData as any[]) {
            if (row.origen && row.destino) {
              // Helper to parse currency with commas
              const parsePrice = (val: any) => {
                 if (!val) return 0;
                 if (typeof val === 'number') return val;
                 const str = val.toString().replace(/,/g, '').trim();
                 return parseFloat(str) || 0;
              };

              // Check if vehicle type indicates overweight
              const v = (row.vehicle || "").toLowerCase();
              const isOverweight = v.includes("sobrepeso") || v.includes("sp");
              
              ratesToImport.push({
                origen: row.origen,
                destino: row.destino,
                rabon: parsePrice(row.rabon),
                sencillo: parsePrice(row.sencillo),
                full: parsePrice(row.full),
                // Support multiple header formats: 'sencillo_sobrepeso', 'sencillo_(sp)', 'sencillo_sp'
                sencillo_sobrepeso: parsePrice(row.sencillo_sobrepeso || row['sencillo_(sp)'] || row['sencillo_sp']),
                full_sobrepeso: parsePrice(row.full_sobrepeso || row['full_(sp)'] || row['full_sp']),
                createdAt: new Date().toISOString()
              });
            }
          }

          if (ratesToImport.length > 0) {
            const response = await fetch('/api/tarifas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ratesToImport)
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || errorData.message || 'Failed to import rates');
            }

            const result = await response.json();
            toast.success(`${result.count} tarifas importadas correctamente`);
            fetchRates(); // Refresh list
          } else {
            toast.warning("No se encontraron tarifas válidas para importar");
          }
          
        } catch (error) {
          console.error("Error importing CSV:", error);
          toast.error("Error al procesar el archivo");
        }
      },
      error: (error) => {
        toast.error("Error al leer el CSV: " + error.message);
      }
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta tarifa?")) return;
    try {
      const response = await fetch(`/api/tarifas/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete');
      }
      
      toast.success("Tarifa eliminada");
      fetchRates();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleNewRate = () => {
    toast.info("Funcionalidad de crear tarifa individual próximamente");
  };

  // Download template
  const downloadTemplate = () => {
    // Extended template with new fields matching user preference
    const csvContent = "ORIGEN,DESTINO,RABON,SENCILLO,SENCILLO (SP),FULL,FULL (SP)\nLima,Arequipa,1200,1500,1800,2000,2400\nLima,Trujillo,800,1000,1200,1400,1600";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_tarifas_completa.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get unique origins for filter
  const uniqueBases = Array.from(new Set(rates.map(r => r.origen || r.origin || "").filter(Boolean))).sort();

  // Filter and Sort
  const processedRates = rates
    .filter(rate => {
      const searchLower = searchTerm.toLowerCase();
      const origin = (rate.origen || rate.origin || "").toLowerCase();
      const destination = (rate.destino || rate.destination || "").toLowerCase();
      const vehicle = (rate.vehicle || "").toLowerCase();
      
      const matchesSearch = origin.includes(searchLower) || 
                          destination.includes(searchLower) || 
                          vehicle.includes(searchLower);
                          
      const matchesBase = selectedBase === 'all' || (rate.origen || rate.origin) === selectedBase;
      
      return matchesSearch && matchesBase;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity') {
        // First usage count
        const diff = (b.usageCount || 0) - (a.usageCount || 0);
        if (diff !== 0) return diff;
        // Then A-Z
        const originA = a.origen || a.origin || "";
        const originB = b.origen || b.origin || "";
        const compareOrigin = originA.localeCompare(originB);
        if (compareOrigin !== 0) return compareOrigin;
        
        const destA = a.destino || a.destination || "";
        const destB = b.destino || b.destination || "";
        return destA.localeCompare(destB);
      }
      
      // Default A-Z (Origin -> Destination)
      const originA = a.origen || a.origin || "";
      const originB = b.origen || b.origin || "";
      const compareOrigin = originA.localeCompare(originB);
      if (compareOrigin !== 0) return compareOrigin;
      
      const destA = a.destino || a.destination || "";
      const destB = b.destino || b.destination || "";
      return destA.localeCompare(destB);
    });

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tags className="w-6 h-6 text-red-700" />
            Tarifario General
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los precios base por ruta y tipo de unidad</p>
        </div>
        
        <div className="flex gap-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={handleFileUpload}
          />
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            title="Descargar plantilla CSV"
          >
            <Download className="w-4 h-4" />
            Plantilla
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            title="Importar tarifas desde CSV"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button 
            onClick={handleNewRate}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarifa
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por origen, destino o vehículo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="Ordenar por" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">A-Z (Origen)</SelectItem>
              <SelectItem value="popularity">Más Solicitadas</SelectItem>
            </SelectContent>
          </Select>

          {/* Base Filter */}
          <Select value={selectedBase} onValueChange={setSelectedBase}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="Filtrar por Base" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las bases</SelectItem>
              {uniqueBases.map(base => (
                <SelectItem key={base} value={base}>{base}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origen</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destino</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Rabón</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Sencillo</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Sencillo (SP)</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Full</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Full (SP)</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedRates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Tags className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No hay tarifas registradas</p>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                        Comienza agregando las tarifas base para tus rutas frecuentes.
                      </p>
                      <button 
                        onClick={handleNewRate}
                        className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline"
                      >
                        Crear mi primera tarifa
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedRates.map((rate, index) => (
                  <tr key={index} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-4 px-6 text-sm text-gray-900 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {rate.origen || rate.origin}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {rate.destino || rate.destination}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 text-right">
                      {rate.rabon ? `$${rate.rabon}` : (rate.vehicle?.toLowerCase().includes('rabon') ? `$${rate.price}` : '-')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 text-right">
                      {rate.sencillo ? `$${rate.sencillo}` : (rate.vehicle?.toLowerCase().includes('sencillo') ? `$${rate.price}` : '-')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 text-right text-orange-600 font-medium">
                      {rate.sencillo_sobrepeso ? `$${rate.sencillo_sobrepeso}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 text-right">
                      {rate.full ? `$${rate.full}` : (rate.vehicle?.toLowerCase().includes('trailer') || rate.vehicle?.toLowerCase().includes('full') ? `$${rate.price}` : '-')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 text-right text-orange-600 font-medium">
                      {rate.full_sobrepeso ? `$${rate.full_sobrepeso}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(rate.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
