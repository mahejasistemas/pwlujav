"use client";

import { useState, useEffect, useMemo } from "react";
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
  Mail,
  BarChart3,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { ClientsCharts } from "@/components/ClientsCharts";

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
  createdAt?: string;
}

interface Company {
  id: string;
  name: string;
  employeesCount: number;
  logo?: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"clientes" | "empresas" | "graficos">("clientes");
  const [menuClientId, setMenuClientId] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const companyLogos = useMemo(() => {
    const logos: Record<string, string> = {};
    clients.forEach((client) => {
      if (client.company && client.logo && !logos[client.company]) {
        logos[client.company] = client.logo;
      }
    });
    return logos;
  }, [clients]);

  const uniqueCompanyNames = useMemo(
    () =>
      Array.from(new Set(companies.map((company) => company.name))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [companies],
  );

  // Load clients from Firebase Realtime
  useEffect(() => {
    if (!db) {
      console.error("Firebase DB not initialized");
      setLoading(false);
      return;
    }
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

  // Load companies
  useEffect(() => {
    if (!db) {
      console.error("Firebase DB not initialized");
      setLoadingCompanies(false);
      return;
    }
    const q = query(collection(db, "companies"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const companiesData: Company[] = [];
      querySnapshot.forEach((doc) => {
        companiesData.push({ id: doc.id, ...doc.data() } as Company);
      });
      setCompanies(companiesData);
      setLoadingCompanies(false);
    }, (error) => {
      console.error("Error fetching companies:", error);
      setLoadingCompanies(false);
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
    email: "",
    serviceType: "Carga General"
  });
  const [companySelectionMode, setCompanySelectionMode] = useState<"existing" | "new">("new");

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientData, setEditClientData] = useState({
    name: "",
    company: "",
    country: "",
    region: "",
    logo: "",
    phoneCode: "+52",
    phoneNumber: "",
    email: "",
    serviceType: "Carga General"
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

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditClientData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clientMetrics = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.status !== "sin_exito").length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isSameMonth = (date: Date) =>
      date.getMonth() === currentMonth && date.getFullYear() === currentYear;

    const parseClientDate = (client: Client): Date | null => {
      if (client.createdAt) {
        const d = new Date(client.createdAt);
        if (!isNaN(d.getTime())) return d;
      }
      if (client.date) {
        const d = new Date(client.date);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    const newThisMonth = clients.filter((client) => {
      const d = parseClientDate(client);
      if (!d) return false;
      return isSameMonth(d);
    }).length;

    return {
      total,
      active,
      newThisMonth,
    };
  }, [clients]);

  const syncCompanyForNewClient = async (companyName: string, logo?: string) => {
    if (!db) return;
    const trimmedName = companyName.trim();
    if (!trimmedName) return;

    const companiesCol = collection(db, "companies");
    const q = query(companiesCol, where("name", "==", trimmedName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(companiesCol, {
        name: trimmedName,
        employeesCount: 1,
        ...(logo ? { logo } : {}),
      });
    } else {
      const companyDoc = snapshot.docs[0];
      const data = companyDoc.data();
      const currentCount = (data.employeesCount as number) || 0;
      const updatePayload: Partial<{ employeesCount: number; logo: string }> = {
        employeesCount: currentCount + 1,
      };
      if (logo && !data.logo) {
        updatePayload.logo = logo;
      }
      await updateDoc(companyDoc.ref, updatePayload);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!db) {
        toast.error("No se pudo conectar a la base de datos");
        return;
      }

      const newClient = {
        name: newClientData.name,
        company: newClientData.company,
        date: new Date().toLocaleDateString(),
        createdAt: new Date().toISOString(),
        location: `${newClientData.region}, ${newClientData.country}`,
        status: "en_proceso",
        serviceType: newClientData.serviceType,
        logo: newClientData.logo,
        phone: `${newClientData.phoneCode} ${newClientData.phoneNumber}`,
        email: newClientData.email,
        quotesCount: 0,
        reports: []
      };
      
      await addDoc(collection(db, "clients"), newClient);
      await syncCompanyForNewClient(newClientData.company, newClientData.logo);
      
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
        email: "",
        serviceType: "Carga General"
      });
      setCompanySelectionMode("new");
      toast.success("Cliente creado exitosamente");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error al crear el cliente");
    }
  };

  const updateClientStatus = async (clientId: string, newStatus: Client['status']) => {
    try {
      if (!db) return;
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

  const handleDeleteClient = async (clientId: string) => {
    try {
      if (!db) return;
      const confirmDelete = window.confirm("¿Quieres eliminar este cliente?");
      if (!confirmDelete) return;
      const clientRef = doc(db, "clients", clientId);
      await deleteDoc(clientRef);
      toast.success("Cliente eliminado");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error al eliminar el cliente");
    }
  };

  const openEditClient = (client: Client) => {
    let country = "";
    let region = "";
    if (client.location) {
      const parts = client.location.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        region = parts[0];
        country = parts.slice(1).join(", ");
      }
    }

    let phoneCode = "+52";
    let phoneNumber = "";
    if (client.phone) {
      const segments = client.phone.split(" ").filter(Boolean);
      if (segments.length > 0 && segments[0].startsWith("+")) {
        phoneCode = segments[0];
        phoneNumber = segments.slice(1).join("").replace(/\D/g, "").slice(0, 10);
      } else {
        phoneNumber = client.phone.replace(/\D/g, "").slice(0, 10);
      }
    }

    setEditClientData({
      name: client.name,
      company: client.company,
      country,
      region,
      logo: client.logo || "",
      phoneCode,
      phoneNumber,
      email: client.email || "",
      serviceType: client.serviceType || "Carga General",
    });
    setEditingClient(client);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!db || !editingClient) return;
      const clientRef = doc(db, "clients", editingClient.id);

      await updateDoc(clientRef, {
        name: editClientData.name,
        company: editClientData.company,
        location: `${editClientData.region}, ${editClientData.country}`,
        phone: `${editClientData.phoneCode} ${editClientData.phoneNumber}`,
        email: editClientData.email,
        serviceType: editClientData.serviceType,
        logo: editClientData.logo,
      });

      setEditingClient(null);
      toast.success("Cliente actualizado");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Error al actualizar el cliente");
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

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-white min-h-screen font-sans relative">
      <div className="flex gap-6 items-start">
        <div className="w-48 border-r border-gray-100 pr-4 sticky top-8 self-start">
          <div className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Secciones
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveSection("clientes")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                activeSection === "clientes"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Clientes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("empresas")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                activeSection === "empresas"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Empresas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("graficos")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                activeSection === "graficos"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Gráficos</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeSection === "clientes" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">Todos los Clientes</h1>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  Nuevo Cliente
                  <Plus className="h-4 w-4" />
                </button>
              </div>

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

              <div className="w-full">
                {loading ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Cargando clientes...
                  </div>
                ) : clients.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No hay clientes registrados. Haz clic en "Nuevo Cliente" para empezar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="w-full h-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all group cursor-pointer relative flex flex-col"
                      >
                        <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-gray-500 font-bold text-xs overflow-hidden ${client.logo ? "bg-white" : "bg-gray-100"}`}>
                              {client.logo ? (
                                <img src={client.logo} alt={client.company} className="w-full h-full object-contain" />
                              ) : (
                                (client.company?.slice(0, 2)?.toUpperCase() || "—")
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 truncate group-hover:underline">
                                {client.name || ""}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {client.company || ""}
                              </div>
                            </div>
                          </div>
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuClientId(menuClientId === client.id ? null : client.id);
                              }}
                              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuClientId === client.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditClient(client);
                                    setMenuClientId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setMenuClientId(null);
                                    await handleDeleteClient(client.id);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                >
                                  Borrar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{client.date || ""}</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{client.location || ""}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{client.phone ?? ""}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{client.email ?? ""}</span>
                          </div>
                        </div>
                        </div>

                        <div className="mt-auto -mx-4 -mb-4 px-4 py-3 bg-[#e40014] border-t border-[#e40014] rounded-b-xl flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-white text-[11px] font-medium text-[#e40014]">
                            {client.serviceType || ""}
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-white/90">
                            <div className="flex items-center gap-1">
                              <Calculator className="h-3 w-3" />
                              <span>{client.quotesCount ?? 0} cotizaciones</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{client.reports?.length ?? 0} reportes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === "empresas" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Empresas</h1>
              </div>
              <div className="flex-1">
                {loadingCompanies ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Cargando empresas...
                  </div>
                ) : companies.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    Aún no hay empresas registradas. Crea un cliente para empezar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {companies.map((company) => {
                      const companyLogo = company.logo || companyLogos[company.name];
                      return (
                        <div
                          key={company.id}
                          className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-gray-500 font-bold text-xs overflow-hidden ${companyLogo ? "bg-white" : "bg-gray-100"}`}>
                              {companyLogo ? (
                                <img src={companyLogo} alt={company.name} className="w-full h-full object-contain" />
                              ) : (
                                company.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {company.name}
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                            <span className="font-medium">Trabajadores</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-[11px] font-medium text-gray-800">
                              {company.employeesCount} {company.employeesCount === 1 ? "empleado" : "empleados"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "graficos" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold text-gray-900">Gráficos</h1>
              </div>
              <ClientsCharts clients={clients} />
            </div>
          )}
        </div>
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
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingClient(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
              <button 
                onClick={() => setEditingClient(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateClient} className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Logo de la Empresa</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditLogoChange}
                      className="hidden"
                      id="edit-logo-upload"
                    />
                    <label
                      htmlFor="edit-logo-upload"
                      className="flex items-center gap-2 w-full px-3 py-2 border border-gray-200 border-dashed rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {editClientData.logo ? "Logo seleccionado" : "Subir logo (imagen)"}
                    </label>
                  </div>
                  {editClientData.logo && (
                    <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                      <img src={editClientData.logo} alt="Preview" className="w-full h-full object-cover" />
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
                    value={editClientData.name}
                    onChange={(e) => setEditClientData({...editClientData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Empresa</label>
                  <input 
                    required
                    type="text" 
                    value={editClientData.company}
                    onChange={(e) => setEditClientData({...editClientData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    placeholder="Ej. Transportes SAC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <div className="flex gap-2">
                    <Select
                      value={editClientData.phoneCode}
                      onValueChange={(value) => setEditClientData({...editClientData, phoneCode: value})}
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
                        value={editClientData.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditClientData({...editClientData, phoneNumber: value});
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                        placeholder="123 456 7890"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                      type="email" 
                      value={editClientData.email}
                      onChange={(e) => setEditClientData({...editClientData, email: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">País</label>
                  <Select
                    value={editClientData.country}
                    onValueChange={(value) => setEditClientData({...editClientData, country: value, region: ""})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar país" />
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
                    value={editClientData.region}
                    onValueChange={(value) => setEditClientData({...editClientData, region: value})}
                    disabled={!editClientData.country}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {editClientData.country && LOCATIONS[editClientData.country as keyof typeof LOCATIONS]?.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Tipo de Carga</label>
                <Select
                  value={editClientData.serviceType}
                  onValueChange={(value) => setEditClientData({ ...editClientData, serviceType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de carga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carga General">Carga General</SelectItem>
                    <SelectItem value="Carga Contenerizada">Carga Contenerizada</SelectItem>
                    <SelectItem value="Carga Mixta">Carga Mixta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Create Client Modal */}
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
                  <div className="space-y-2">
                    <Select
                      value={
                        companySelectionMode === "existing" && newClientData.company
                          ? newClientData.company
                          : "__new__"
                      }
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setCompanySelectionMode("new");
                          setNewClientData((prev) => ({
                            ...prev,
                            company: "",
                            logo: "",
                          }));
                        } else {
                          setCompanySelectionMode("existing");
                          setNewClientData((prev) => ({
                            ...prev,
                            company: value,
                            logo: companyLogos[value] || prev.logo,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueCompanyNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">Nueva empresa</SelectItem>
                      </SelectContent>
                    </Select>

                    {companySelectionMode === "new" && (
                      <div className="space-y-2">
                        <input
                          required
                          type="text"
                          value={newClientData.company}
                          onChange={(e) =>
                            setNewClientData({
                              ...newClientData,
                              company: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                          placeholder="Ej. Transportes SAC"
                        />
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium text-gray-600">
                            Logo de la nueva empresa
                          </div>
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
                                {newClientData.logo
                                  ? "Logo seleccionado"
                                  : "Subir logo (imagen)"}
                              </label>
                            </div>
                            {newClientData.logo && (
                              <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                <img
                                  src={newClientData.logo}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {companySelectionMode === "existing" && newClientData.logo && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Logo de la empresa:</span>
                        <div className="w-8 h-8 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                          <img
                            src={newClientData.logo}
                            alt={newClientData.company}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Tipo de Carga</label>
                <Select
                  value={newClientData.serviceType}
                  onValueChange={(value) => setNewClientData({ ...newClientData, serviceType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de carga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carga General">Carga General</SelectItem>
                    <SelectItem value="Carga Contenerizada">Carga Contenerizada</SelectItem>
                    <SelectItem value="Carga Mixta">Carga Mixta</SelectItem>
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
