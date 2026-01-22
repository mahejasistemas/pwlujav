"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  Mail,
  Calendar,
  UserCog,
  Info,
  MapPin,
  Phone,
  Pencil,
  Clock,
  Loader2,
  Trash2
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface UserData {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  lastLogin: any;
  createdAt: any;
  photoURL?: string;
  base?: "Hermosillo" | "Puebla" | "Altamira" | "Veracruz";
  phoneNumber?: string;
  workSchedule?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  
  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    base: "",
    phoneNumber: "",
    workSchedule: "",
    role: "user" as "admin" | "user",
    status: "active" as "active" | "inactive"
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAuthorized(true);
          } else {
            toast.error("Acceso denegado", {
              description: "Esta sección es exclusiva para administradores."
            });
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Error verifying admin role:", error);
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsers = () => {
    setLoading(true);
    // Removed orderBy to avoid missing index issues initially. Sorting client-side instead.
    const q = query(collection(db, "users"));
    
    // We use onSnapshot for real-time, but we can also trigger manual refresh
    // The existing useEffect sets up the listener.
  };

  useEffect(() => {
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      
      // Sort client-side
      usersList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      });
      toast.success(`Rol actualizado a ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: "active" | "inactive") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: newStatus
      });
      toast.success(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar estado");
    }
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      base: user.base || "",
      phoneNumber: user.phoneNumber || "",
      workSchedule: user.workSchedule || "",
      role: user.role,
      status: user.status
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        base: editForm.base,
        phoneNumber: editForm.phoneNumber,
        workSchedule: editForm.workSchedule,
        role: editForm.role,
        status: editForm.status
      });
      toast.success("Usuario actualizado correctamente");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`¿Estás seguro de eliminar a ${user.displayName}? Esta acción eliminará sus datos de la plataforma.`)) return;
    
    try {
      await deleteDoc(doc(db, "users", user.id));
      toast.success("Usuario eliminado correctamente");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error al eliminar usuario");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-700" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1">Administra los accesos y roles de la plataforma</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <div className="px-3 py-1.5 bg-gray-100 rounded-md">
            <span className="text-xs font-medium text-gray-500 uppercase">Total</span>
            <div className="text-lg font-bold text-gray-900 leading-none">{users.length}</div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="px-3 py-1.5">
            <span className="text-xs font-medium text-gray-500 uppercase">Admins</span>
            <div className="text-lg font-bold text-gray-900 leading-none">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setRoleFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === 'all' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setRoleFilter("admin")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === 'admin' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Administradores
          </button>
          <button 
            onClick={() => setRoleFilter("user")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === 'user' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Usuarios
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
        <Info className="h-4 w-4" />
        <AlertTitle>¿No ves a todos los usuarios?</AlertTitle>
        <AlertDescription className="text-blue-700/80">
          Esta lista muestra solo los usuarios que han iniciado sesión recientemente y se han sincronizado con la base de datos.
          Si falta alguien, pídale que cierre e inicie sesión nuevamente para activar su perfil.
        </AlertDescription>
      </Alert>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Último Acceso</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
                          ) : (
                            user.displayName?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName || "Usuario sin nombre"}</div>
                          {user.base && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {user.base}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {user.workSchedule ? (
                          <>
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {user.workSchedule}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No asignado</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.status === 'active' || !user.status
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {user.status === 'active' || !user.status ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {user.status === 'active' || !user.status ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(user.lastLogin)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(user)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteUser(user)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información y permisos para {editingUser?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="base" className="text-right">
                Base
              </Label>
              <div className="col-span-3">
                <Select
                  value={editForm.base}
                  onValueChange={(value) => setEditForm({ ...editForm, base: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hermosillo">Hermosillo</SelectItem>
                    <SelectItem value="Puebla">Puebla</SelectItem>
                    <SelectItem value="Altamira">Altamira</SelectItem>
                    <SelectItem value="Veracruz">Veracruz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="phone"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                className="col-span-3"
                placeholder="55 1234 5678"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule" className="text-right">
                Horario
              </Label>
              <Input
                id="schedule"
                value={editForm.workSchedule}
                onChange={(e) => setEditForm({ ...editForm, workSchedule: e.target.value })}
                className="col-span-3"
                placeholder="Ej. Lunes a Viernes 9am - 6pm"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
              <Label htmlFor="role" className="text-right font-semibold text-gray-700">
                Rol
              </Label>
              <div className="col-span-3">
                <Select
                  value={editForm.role}
                  onValueChange={(value: "admin" | "user") => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {editForm.role === 'admin' 
                    ? 'Tiene acceso completo a todas las funciones del sistema.' 
                    : 'Tiene acceso limitado a funciones básicas.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right font-semibold text-gray-700">
                Estado
              </Label>
              <div className="col-span-3">
                <Select
                  value={editForm.status}
                  onValueChange={(value: "active" | "inactive") => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger className={editForm.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-green-600">Activo</SelectItem>
                    <SelectItem value="inactive" className="text-red-600">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {editForm.status === 'inactive' 
                    ? 'El usuario no podrá iniciar sesión en el sistema.' 
                    : 'El usuario tiene acceso permitido.'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}