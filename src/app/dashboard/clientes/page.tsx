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
  Clock,
  Upload,
  Phone,
  Mail
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
  logo?: string;
  phone?: string;
  email?: string;
}

const LOCATIONS = {
  "México": ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Estado de México", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"],
  "Estados Unidos": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  "Colombia": ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"],
  "Perú": ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"],
  "Argentina": ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"],
  "Chile": ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"],
  "España": ["Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña", "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "País Vasco", "La Rioja", "Valencia"]
};

export default function ClientsPage() {
  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Load clients from Firebase Realtime
  useEffect(() => {
    const firestore = db;
    if (!firestore) {
      console.error("Firebase DB not initialized");
      setLoading(false);
      return;
    }
    const q = query(collection(firestore, "clients"), orderBy("date", "desc"));
    
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
    country: "",
    region: "",
    logo: "",
    phoneCode: "+52",
    phoneNumber: "",
    email: ""
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewClientData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const firestore = db;
      if (!firestore) {
        toast.error("No se pudo conectar a la base de datos");
        return;
      }

      const newClient = {
        name: newClientData.name,
        company: newClientData.company,
        date: new Date().toLocaleDateString(),
        location: `${newClientData.region}, ${newClientData.country}`,
        status: "en_proceso",
        serviceType: "Carga General", // Default value
        logo: newClientData.logo,
        phone: `${newClientData.phoneCode} ${newClientData.phoneNumber}`,
        email: newClientData.email,
        quotesCount: 0,
        reports: []
      };
      
      await addDoc(collection(firestore, "clients"), newClient);
      
      setIsCreateModalOpen(false);
      // Reset form
      setNewClientData({
        name: "",
        company: "",
        country: "",
        region: "",
        logo: "",
        phoneCode: "+52",
        phoneNumber: "",
        email: ""
      });
      toast.success("Cliente creado exitosamente");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error al crear el cliente");
    }
  };

  const updateClientStatus = async (clientId: string, newStatus: Client['status']) => {
    try {
      const firestore = db;
      if (!firestore) return;
      const clientRef = doc(firestore, "clients", clientId);
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
              <th className="py-3 pr-4 text-xs font-semibold text-gray-500 pl-1 w-[40%]">Nombre / Empresa</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-[15%]">
                 <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                  Fecha <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-[20%]">Ubicación</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-[20%]">Tipo de Servicio</th>
              <th className="py-3 pl-4 text-xs font-semibold text-gray-500 w-[5%] text-right pr-2">
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
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-gray-500 font-bold text-xs overflow-hidden ${client.logo ? "bg-white" : "bg-gray-100"}`}>
                        {client.logo ? (
                          <img src={client.logo} alt={client.company} className="w-full h-full object-contain" />
                        ) : (
                          client.company.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 group-hover:underline truncate">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{client.company}</div>
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
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-gray-500 font-bold text-xl shadow-inner overflow-hidden ${selectedClient.logo ? "bg-white" : "bg-gray-100"}`}>
                  {selectedClient.logo ? (
                    <img src={selectedClient.logo} alt={selectedClient.company} className="w-full h-full object-contain" />
                  ) : (
                    selectedClient.company.substring(0, 2).toUpperCase()
                  )}
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
                    {selectedClient.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teléfono</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {selectedClient.phone}
                        </span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Correo</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {selectedClient.email}
                        </span>
                      </div>
                    )}
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
              {/* Logo Upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Logo de la Empresa</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center gap-2 w-full px-3 py-2 border border-gray-200 border-dashed rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {newClientData.logo ? "Logo seleccionado" : "Subir logo (imagen)"}
                    </label>
                  </div>
                  {newClientData.logo && (
                    <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                      <img src={newClientData.logo} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

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

              {/* Phone and Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <div className="flex gap-2">
                    <Select
                      value={newClientData.phoneCode}
                      onValueChange={(value) => setNewClientData({...newClientData, phoneCode: value})}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Código" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+52">🇲🇽 +52</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+57">🇨🇴 +57</SelectItem>
                        <SelectItem value="+51">🇵🇪 +51</SelectItem>
                        <SelectItem value="+54">🇦🇷 +54</SelectItem>
                        <SelectItem value="+56">🇨🇱 +56</SelectItem>
                        <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input 
                        type="tel" 
                        maxLength={10}
                        value={newClientData.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setNewClientData({...newClientData, phoneNumber: value});
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                        placeholder="123 456 7890"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">País</label>
                  <Select
                    value={newClientData.country}
                    onValueChange={(value) => setNewClientData({...newClientData, country: value, region: ""})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar País" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LOCATIONS).map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Estado / Región</label>
                  <Select
                    value={newClientData.region}
                    onValueChange={(value) => setNewClientData({...newClientData, region: value})}
                    disabled={!newClientData.country}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {newClientData.country && LOCATIONS[newClientData.country as keyof typeof LOCATIONS]?.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
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
