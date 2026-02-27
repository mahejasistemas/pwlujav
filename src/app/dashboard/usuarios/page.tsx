"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Shield,
  Mail,
  Calendar,
  Search,
  ShieldAlert,
  Check,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Role = "admin" | "user" | "sistemas";

interface UserRow {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: Role;
  status?: string;
  createdAt?: any;
  lastLogin?: any;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role>("user");

  const getInitials = (user: UserRow) => {
    if (user.displayName) {
      return user.displayName.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "US";
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "admin":
        return "bg-black text-white border-black";
      case "sistemas":
        return "bg-purple-600 text-white border-purple-600";
      default:
        return "text-gray-700 border-gray-300";
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case "admin": return "Administrador";
      case "sistemas": return "Sistemas";
      default: return "Usuario";
    }
  };

  const fetchUsersList = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Could not fetch profiles", error);
        setUsers([]);
      } else if (data) {
        const mappedUsers: UserRow[] = data.map((u: any) => ({
          id: u.id,
          uid: u.id,
          displayName: u.full_name || u.email?.split('@')[0] || "Usuario",
          email: u.email || "",
          photoURL: u.avatar_url,
          role: u.role || "user",
          status: "active",
          createdAt: u.created_at,
          lastLogin: u.updated_at
        }));
        setUsers(mappedUsers);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  }, []);

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }

      // 1. Get Auth User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        
        // 2. Get User Role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const role = (profile?.role as Role) || "user";
        setCurrentUserRole(role);

        // 3. Fetch Data based on Role
        if (role === 'admin' || role === 'sistemas') {
          await fetchUsersList();
        }
      }
      setLoading(false);
    };

    initPage();
  }, [fetchUsersList]);

  const filteredUsers = useMemo(() => {
    const queryText = search.toLowerCase().trim();
    if (!queryText) return users;
    return users.filter((u) => {
      return (
        u.displayName.toLowerCase().includes(queryText) ||
        u.email.toLowerCase().includes(queryText) ||
        u.role.toLowerCase().includes(queryText)
      );
    });
  }, [users, search]);

  const handleChangeRole = async (userId: string, newRole: Role) => {
    if (!supabase) {
      toast.error("No se pudo conectar a la base de datos");
      return;
    }

    if (currentUserRole !== 'admin') {
      toast.error("Solo los administradores pueden cambiar roles.");
      return;
    }

    // Optimistic Update
    const originalUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Rol actualizado a ${getRoleLabel(newRole)}`);
    } catch (error: any) {
      // Revert on error
      setUsers(originalUsers);
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol: " + (error.message || "Desconocido"));
    }
  };

  const formatDate = (value?: any) => {
    if (!value) return "-";
    try {
      // Check if string is ISO format
      const date = new Date(value);
      if (isNaN(date.getTime())) return "-";
      return format(date, "dd MMM yyyy, HH:mm", { locale: es });
    } catch {
      return "-";
    }
  };

  // Bloqueo de acceso para usuarios normales
  if (currentUserRole === 'user' && !loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <ShieldAlert className="w-12 h-12 mx-auto text-gray-400" />
          <h1 className="text-xl font-bold text-gray-900">
            Acceso Restringido
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Tu rol actual ({getRoleLabel(currentUserRole)}) no tiene permisos para gestionar usuarios.
            Solo puedes ver tu propia actividad en la plataforma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-700" />
              <h1 className="text-xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              Administra los usuarios registrados y sus roles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`gap-1 ${getRoleBadgeColor(currentUserRole)}`}>
              <Shield className="w-3 h-3" />
              {getRoleLabel(currentUserRole)}
            </Badge>
          </div>
        </header>

        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o rol"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-black placeholder:text-gray-400 bg-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm py-10 text-center text-sm text-gray-500">
              Cargando usuarios...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm py-10 text-center text-sm text-gray-500">
              No se encontraron usuarios.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-full bg-gray-900 text-white flex items-center justify-center overflow-hidden text-xs font-semibold shadow-sm">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(user)
                        )}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          user.status === "active" ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {user.displayName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                        <div className="sm:flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 ${getRoleBadgeColor(user.role)}`}
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>Creado: {formatDate(user.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>Acceso: {formatDate(user.lastLogin)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                     <div className="text-xs text-gray-400 font-mono">
                        ID: {user.uid.slice(0,8)}...
                     </div>
                     
                     {/* Actions: Only Admin can change roles */}
                     {currentUserRole === 'admin' && user.id !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                               <span>Cambiar Rol</span>
                               <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, "user")} disabled={user.role === 'user'}>
                               <div className="flex items-center justify-between w-full">
                                  <span>Usuario</span>
                                  {user.role === 'user' && <Check className="w-3 h-3" />}
                               </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, "admin")} disabled={user.role === 'admin'}>
                               <div className="flex items-center justify-between w-full">
                                  <span>Administrador</span>
                                  {user.role === 'admin' && <Check className="w-3 h-3" />}
                               </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeRole(user.id, "sistemas")} disabled={user.role === 'sistemas'}>
                               <div className="flex items-center justify-between w-full">
                                  <span>Sistemas</span>
                                  {user.role === 'sistemas' && <Check className="w-3 h-3" />}
                               </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                     )}

                     {/* Sistemas View Only (Can verify but not change role here, maybe reset password link?) */}
                     {currentUserRole === 'sistemas' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 cursor-not-allowed">
                           Ver Detalles
                        </Button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
