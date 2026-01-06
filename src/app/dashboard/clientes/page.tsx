"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  ArrowUpDown,
  User,
  Building2,
  ChevronDown,
  X,
  FileText,
  Calculator,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  company: string;
  date: string;
  location: string;
  status: "completado" | "en_proceso" | "sin_exito";
  serviceType: string;
  quotesCount: number;
  reports: { id: number; title: string; date: string }[];
}

export default function ClientsPage() {
  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Load clients from Firebase Realtime
  useEffect(() => {
    const q = query(collection(db, "clients"), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData: Client[] = [];
      querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients:", error);
      toast.error("No se pudo conectar. Asegúrate de crear la base de datos en Firebase Console.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Create Client State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    company: "",
    location: "",
    serviceType: "",
    status: "en_proceso" as "completado" | "en_proceso" | "sin_exito"
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newClient = {
        name: newClientData.name,
        company: newClientData.company,
        date: new Date().toLocaleDateString(),
        location: newClientData.location,
        status: newClientData.status,
        serviceType: newClientData.serviceType,
        quotesCount: 0,
        reports: []
      };
      
      await addDoc(collection(db, "clients"), newClient);
      
      setIsCreateModalOpen(false);
      // Reset form
      setNewClientData({
        name: "",
        company: "",
        location: "",
        serviceType: "",
        status: "en_proceso"
      });
      toast.success("Cliente creado exitosamente");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error al crear el cliente");
    }
  };

  const updateClientStatus = async (clientId: string, newStatus: Client['status']) => {
    try {
      const clientRef = doc(db, "clients", clientId);
      await updateDoc(clientRef, {
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
      case "completado": return "bg-green-100 text-green-700 border-green-200";
      case "en_proceso": return "bg-amber-100 text-amber-700 border-amber-200";
      case "sin_exito": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completado": return <CheckCircle2 className="h-3 w-3" />;
      case "en_proceso": return <Clock className="h-3 w-3" />;
      case "sin_exito": return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  // Calculate stats
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "en_proceso").length;
  // Simple check for "new" clients (registered this month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newClients = clients.filter(c => {
    const [day, month, year] = c.date.split('/').map(Number);
    // Assuming format dd/mm/yyyy or similar where parts are predictable enough for this demo
    // If date parsing fails, we ignore it
    if (!month || !year) return false;
    return (month - 1) === currentMonth && year === currentYear;
  }).length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-white min-h-screen font-sans relative">
      
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">Todos los Clientes</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          Nuevo Cliente
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Stats Overview Section */}
      <div className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Clientes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                100%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalClients}</h3>
              <p className="text-xs text-gray-400 mt-1">Base de datos activa</p>
            </div>
          </div>

          {/* Card 2: Clientes Nuevos */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Plus className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                Este mes
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Clientes Nuevos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{newClients}</h3>
              <p className="text-xs text-gray-400 mt-1">Registrados este mes</p>
            </div>
          </div>

          {/* Card 3: Clientes Activos */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                En Proceso
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeClients}</h3>
              <p className="text-xs text-gray-400 mt-1">Con envíos recientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar Section */}
      <div className="flex items-center justify-between mb-4">
        <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Ordenar
        </button>
        <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 cursor-pointer group">
          <Search className="h-4 w-4 group-hover:text-gray-600" />
          <span className="text-sm">Buscar</span>
        </div>
      </div>

      {/* 4. Minimal Table */}
      <div className="w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pr-4 text-xs font-semibold text-gray-500 w-1/4 pl-1">Nombre / Empresa</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-1/6">
                 <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                  Fecha <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-1/6">Ubicación</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-1/6">Tipo de Servicio</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-1/6 text-center">Estado</th>
              <th className="py-3 pl-4 text-xs font-semibold text-gray-500 w-10 text-right pr-2">
                <Plus className="h-4 w-4 ml-auto cursor-pointer hover:text-gray-700" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                  Cargando clientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                  No hay clientes registrados. Haz clic en "Nuevo Cliente" para empezar.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr 
                  key={client.id} 
                  className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                >
                  <td className="py-3 pr-4 pl-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 font-bold text-xs">
                        {client.company.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:underline">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500">{client.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{client.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{client.location}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                      {client.serviceType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div 
                      className="flex justify-center" 
                      onClick={(e) => e.stopPropagation()} // Prevent row click when changing status
                    >
                      <Select 
                        defaultValue={client.status}
                        onValueChange={(value) => {
                          updateClientStatus(client.id, value as Client['status']);
                        }}
                      >
                        <SelectTrigger className={`h-7 text-xs w-[130px] rounded-full ${getStatusColor(client.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="sin_exito">Sin Éxito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right pr-2">
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Client Details Modal (Right Drawer style) */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedClient(null)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <button 
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xl shadow-inner">
                  {selectedClient.company.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedClient.name}</h2>
                  <p className="text-sm text-gray-500">{selectedClient.company}</p>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Calculator className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Cotizaciones</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{selectedClient.quotesCount}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Reportes</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{selectedClient.reports.length}</div>
                </div>
              </div>

              {/* Info Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    Información General
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ubicación</span>
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {selectedClient.location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha de Registro</span>
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {selectedClient.date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo de Servicio</span>
                      <span className="font-medium text-gray-900">{selectedClient.serviceType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Estado Actual</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedClient.status)}`}>
                        {selectedClient.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reports List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Historial de Reportes
                  </h3>
                  <div className="space-y-2">
                    {selectedClient.reports.length > 0 ? (
                      selectedClient.reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{report.title}</div>
                              <div className="text-xs text-gray-500">{report.date}</div>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-300 -rotate-90" />
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400 italic text-center py-4">No hay reportes disponibles</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Nueva Cotización
                </button>
                <button className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Editar Cliente
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. Create Client Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nuevo Cliente</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre del Contacto</label>
                  <input 
                    required
                    type="text" 
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Empresa</label>
                  <input 
                    required
                    type="text" 
                    value={newClientData.company}
                    onChange={(e) => setNewClientData({...newClientData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    placeholder="Ej. Transportes SAC"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Ubicación</label>
                <input 
                  required
                  type="text" 
                  value={newClientData.location}
                  onChange={(e) => setNewClientData({...newClientData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                  placeholder="Ej. Lima, Perú"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tipo de Servicio</label>
                  <input 
                    required
                    type="text" 
                    value={newClientData.serviceType}
                    onChange={(e) => setNewClientData({...newClientData, serviceType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    placeholder="Ej. Carga Pesada"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Estado Inicial</label>
                  <Select 
                    value={newClientData.status}
                    onValueChange={(value) => setNewClientData({...newClientData, status: value as any})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_proceso">En Proceso</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="sin_exito">Sin Éxito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
