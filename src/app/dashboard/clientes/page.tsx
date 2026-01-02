"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2,
  Trash2,
  Edit2,
  ChevronDown,
  Layout,
  Zap,
  Table as TableIcon,
  ArrowUpDown,
  Lock,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ClientesSidebar from "@/components/ClientesSidebar";

type Cliente = {
  id: string;
  created_at?: string;
  nombre_empresa: string;
  contacto: string;
  correo: string;
  telefono: string;
  direccion?: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    contacto: "",
    correo: "",
    telefono: "",
    direccion: ""
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
      } else {
        setClientes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([formData])
        .select();

      if (error) throw error;

      toast.success("Cliente agregado correctamente");
      setIsModalOpen(false);
      setFormData({
        nombre_empresa: "",
        contacto: "",
        correo: "",
        telefono: "",
        direccion: ""
      });
      fetchClientes();
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error("Error al agregar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClientes = clientes.filter(cliente => 
    cliente.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar Secundario */}
      <ClientesSidebar onNewClient={() => setIsModalOpen(true)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white text-slate-900 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-xl font-semibold text-slate-800">Todos los clientes</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black hover:bg-slate-800 text-white gap-2 rounded-md h-9 px-4 text-sm font-medium"
        >
          Nuevo cliente
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Templates Section */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Plantillas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer bg-white group">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <Layout className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Registro simple</h4>
                <p className="text-sm text-slate-500 mt-1">Gestiona datos básicos.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer bg-white group">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Análisis con IA</h4>
                <p className="text-sm text-slate-500 mt-1">Insights de actividad.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer bg-white group">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <TableIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Gestión de proyectos</h4>
                <p className="text-sm text-slate-500 mt-1">Seguimiento detallado.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" className="h-8 gap-2 text-slate-600 border-gray-200 hover:bg-gray-50">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Ordenar
          </Button>
          
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar" 
              className="pl-4 pr-10 h-9 border-none focus-visible:ring-0 text-right placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-100">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                <th className="py-3 pr-4 pl-2 w-8">
                  <div className="h-4 w-4 border border-gray-300 rounded mx-auto"></div>
                </th>
                <th className="py-3 px-4 font-normal">Nombre</th>
                <th className="py-3 px-4 font-normal">Ubicación</th>
                <th className="py-3 px-4 font-normal flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded">
                  Fecha de registro <ArrowUpDown className="h-3 w-3 opacity-50" />
                </th>
                <th className="py-3 px-4 font-normal">Contacto</th>
                <th className="py-3 px-4 font-normal">Propietario</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4 pl-2 text-center">
                    <div className="h-4 w-4 border border-gray-200 rounded mx-auto group-hover:border-gray-400 transition-colors"></div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                        <TableIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-slate-700 font-medium">{cliente.nombre_empresa}</span>
                      <Lock className="h-3 w-3 text-gray-400 ml-1" />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {cliente.direccion ? (
                       <span className="truncate max-w-[150px] block" title={cliente.direccion}>{cliente.direccion}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(cliente.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    <div className="flex flex-col">
                      <span className="text-slate-700">{cliente.contacto}</span>
                      <span className="text-xs text-gray-400">{cliente.telefono}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium ring-2 ring-white">
                        L
                      </div>
                      <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium ring-2 ring-white -ml-2">
                        +
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredClientes.length === 0 && !loading && (
                 <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No hay clientes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 animate-in zoom-in-95 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Agregar Cliente</h2>
              <Button  
                variant="ghost" 
                size="icon" 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <span className="text-xl text-gray-500">×</span>
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa" className="text-xs font-medium text-gray-500 uppercase">Nombre de la Empresa</Label>
                <Input 
                  id="nombre_empresa"
                  name="nombre_empresa"
                  required
                  placeholder="Ej. Logística Global S.A. de C.V." 
                  className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-black"
                  value={formData.nombre_empresa}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contacto" className="text-xs font-medium text-gray-500 uppercase">Contacto Principal</Label>
                  <Input 
                    id="contacto"
                    name="contacto"
                    required
                    placeholder="Nombre completo" 
                    className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-black"
                    value={formData.contacto}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-xs font-medium text-gray-500 uppercase">Teléfono</Label>
                  <Input 
                    id="telefono"
                    name="telefono"
                    required
                    placeholder="(55) 1234 5678" 
                    className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-black"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo" className="text-xs font-medium text-gray-500 uppercase">Correo Electrónico</Label>
                <Input 
                  id="correo"
                  name="correo"
                  type="email"
                  required
                  placeholder="contacto@empresa.com" 
                  className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-black"
                  value={formData.correo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-xs font-medium text-gray-500 uppercase">Dirección Fiscal / Operativa</Label>
                <Input 
                  id="direccion"
                  name="direccion"
                  placeholder="Calle, Número, Colonia, CP, Ciudad" 
                  className="h-10 bg-gray-50 border-gray-200 focus-visible:ring-black"
                  value={formData.direccion}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-black hover:bg-slate-800 text-white min-w-[120px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
