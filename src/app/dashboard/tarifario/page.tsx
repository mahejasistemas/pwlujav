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
  Download
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";

export default function TarifarioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load rates from Firestore
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const q = query(collection(db, "tarifas"), orderBy("origin"));
      const querySnapshot = await getDocs(q);
      const loadedRates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
      transformHeader: (header) => header.trim().toLowerCase().replace(/^[\uFEFF]/, ""), // Normalize headers
      complete: async (results) => {
        try {
          const parsedData = results.data;
          console.log("Datos parseados:", parsedData); // Debugging
          
          if (parsedData.length === 0) {
            toast.error("El archivo CSV está vacío o no se pudo leer");
            return;
          }

          // Validate first row has required fields
          const firstRow = parsedData[0] as any;
          if (!firstRow.origin || !firstRow.destination || !firstRow.price) {
            toast.error("El formato del CSV no es correcto. Asegúrate de usar las columnas: origin, destination, vehicle, price");
            console.error("Columnas encontradas:", Object.keys(firstRow));
            return;
          }

          let successCount = 0;

          // Expected columns: origin, destination, vehicle, price
          for (const row of parsedData as any[]) {
            if (row.origin && row.destination && row.price) {
              await addDoc(collection(db, "tarifas"), {
                origin: row.origin,
                destination: row.destination,
                vehicle: row.vehicle || "Estándar",
                price: row.price,
                createdAt: new Date()
              });
              successCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`${successCount} tarifas importadas correctamente`);
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
      await deleteDoc(doc(db, "tarifas", id));
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
    const csvContent = "origin,destination,vehicle,price\nLima,Arequipa,Trailer,1500\nLima,Trujillo,Furgon 5T,800";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_tarifas.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
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
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidad</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Base</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Tags className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-1">No hay tarifas registradas</p>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                        Comienza agregando las tarifas base para tus rutas frecuentes y tipos de unidades.
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
                rates.map((rate, index) => (
                  <tr key={index} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-4 px-6 text-sm text-gray-900 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {rate.origin}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {rate.destination}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        {rate.vehicle}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-900">
                      {rate.price}
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
}
