"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Briefcase, MapPin, Users, Calendar, Plus, Trash2, UserPlus, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Workspace {
  id: string;
  name: string;
  base: string;
  created_by: string;
  created_at: string;
  members: WorkspaceMember[];
}

interface WorkspaceMember {
  user_id: string;
  role: string;
  profile?: UserProfile;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export default function EquiposPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Create Workspace State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBase, setNewBase] = useState("");
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, isAdmin]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user.id);
      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    } else {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users (Profiles) for member mapping and selection
      const { data: profiles } = await supabase.from('profiles').select('*');
      const profilesMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});
      setAvailableUsers(profiles || []);

      // 2. Fetch Workspaces
      let query = supabase.from('workspaces').select(`
        *,
        workspace_members (
          user_id,
          role
        )
      `);

      // If not admin, RLS policies will restrict automatically, but we can be explicit if needed
      // RLS is already set up to show workspaces user is member of.
      
      const { data: wsData, error } = await query;

      if (error) throw error;

      // Map profiles to members
      const workspacesData = wsData || [];
      const formattedWorkspaces: Workspace[] = workspacesData.map((ws: any) => ({
        ...ws,
        members: (ws.workspace_members || []).map((m: any) => ({
          ...m,
          profile: profilesMap[m.user_id]
        }))
      }));

      setWorkspaces(formattedWorkspaces);

    } catch (error: any) {
      console.error("Error fetching workspaces:", error);
      toast.error("Error al cargar los equipos: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newName || !newBase) {
      toast.error("Nombre y Base son requeridos");
      return;
    }

    try {
      // 1. Create Workspace
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: newName,
          base: newBase,
          created_by: currentUser
        })
        .select()
        .single();

      if (wsError) throw wsError;

      // 2. Add Members (Admin is automatically added? Maybe not, let's add explicitly if selected)
      // Always add the creator as admin member
      const membersToAdd = [...new Set([...selectedUsers, currentUser])].map(uid => ({
        workspace_id: ws.id,
        user_id: uid,
        role: uid === currentUser ? 'admin' : 'member'
      }));

      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert(membersToAdd);

      if (memberError) throw memberError;

      toast.success("Workspace creado exitosamente");
      setIsCreateOpen(false);
      setNewName("");
      setNewBase("");
      setSelectedUsers([]);
      fetchData(); // Refresh

    } catch (error: any) {
      console.error("Error creating workspace:", error);
      toast.error("Error al crear el workspace: " + error.message);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este workspace?")) return;
    try {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
      toast.success("Workspace eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Helper to generate avatar URL if missing
  const getAvatarUrl = (profile?: UserProfile) => {
    if (profile?.avatar_url) return profile.avatar_url;
    const name = profile?.full_name || profile?.email || "Usuario";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Equipos y Workspaces</h2>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 text-white gap-2">
                <Plus className="w-4 h-4" />
                Crear Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Equipo</DialogTitle>
                <DialogDescription>
                  Define un nuevo espacio de trabajo y asigna sus miembros iniciales.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Workspace</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej. Operaciones Manzanillo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="base">Base Operativa</Label>
                  <Select value={newBase} onValueChange={setNewBase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manzanillo">Manzanillo</SelectItem>
                      <SelectItem value="Puebla">Puebla</SelectItem>
                      <SelectItem value="Altamira">Altamira</SelectItem>
                      <SelectItem value="Veracruz">Veracruz</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Asignar Miembros</Label>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="flex flex-1 items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getAvatarUrl(user)} />
                              <AvatarFallback>{user.full_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{user.full_name || user.email}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateWorkspace} className="bg-black text-white hover:bg-gray-800">Crear Equipo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {workspaces.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-gray-200 bg-gray-50/50">
          <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No hay workspaces asignados</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-1">
            {isAdmin 
              ? "Crea un nuevo espacio de trabajo para comenzar." 
              : "Contacta a un administrador para ser asignado a un equipo."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Card key={ws.id} className="hover:shadow-md transition-shadow relative group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      {ws.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ws.base}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    {ws.members?.length || 0} miembros
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Miembros del Equipo
                    </h4>
                    <div className="flex -space-x-2 overflow-hidden py-1 pl-2">
                      {ws.members.length > 0 ? (
                        ws.members.slice(0, 5).map((m) => (
                          <Avatar key={m.user_id} className="inline-block border-2 border-white w-8 h-8 ring-2 ring-white">
                            <AvatarImage src={getAvatarUrl(m.profile)} />
                            <AvatarFallback className="bg-gray-200 text-[10px] text-gray-600">
                              {m.profile?.full_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">Sin miembros</span>
                      )}
                      {ws.members.length > 5 && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500 ring-2 ring-white">
                          +{ws.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(ws.created_at), "d MMM, yyyy", { locale: es })}
                    </div>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteWorkspace(ws.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
