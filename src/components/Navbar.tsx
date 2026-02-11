"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Search, 
  ChevronDown, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Video, 
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  History,
  Maximize2,
  MoreHorizontal,
  Plus,
  Briefcase,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AIChatBot from "./AIChatBot";

interface Workspace {
  id: string;
  name: string;
  base: string;
}

interface UserData {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  
  // Create Workspace Form
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceBase, setNewWorkspaceBase] = useState("");
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // AI State
  const [isIAOpen, setIsIAOpen] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check admin role
        const userDoc = await getDoc(doc(db!, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data()?.role === 'admin') {
          setIsAdmin(true);
          fetchUsers();
        }
        fetchWorkspaces(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    if (!db) return;
    try {
      const q = query(collection(db!, "users"));
      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setAvailableUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchWorkspaces = async (userId: string) => {
    if (!db) return;
    try {
      // In a real app, query based on membership. For now fetching all or user's created ones.
      // Simplification: Fetch all for admins, or just create a collection
      const q = query(collection(db!, "workspaces"));
      const snapshot = await getDocs(q);
      const wsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workspace[];
      
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
      } else {
        // Default Lujav Workspace
        setCurrentWorkspace({ id: 'default', name: 'Transportes Lujav', base: 'General' });
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!db) return;
    if (!newWorkspaceName || !newWorkspaceBase) {
      toast.error("Por favor completa el nombre y la base");
      return;
    }

    try {
      await addDoc(collection(db!, "workspaces"), {
        name: newWorkspaceName,
        base: newWorkspaceBase,
        members: selectedUsers,
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      });

      toast.success("Workspace creado correctamente");
      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName("");
      setNewWorkspaceBase("");
      setSelectedUsers([]);
      if (user) fetchWorkspaces(user.uid);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Error al crear workspace");
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <>
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-10 relative">
        
        {/* Left: Workspace Selector */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/80 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
                <div className="w-5 h-5 bg-teal-500 rounded text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {currentWorkspace?.name.charAt(0).toUpperCase() || "L"}
                </div>
                <span className="text-sm font-semibold text-gray-700 max-w-[150px] truncate">
                  {currentWorkspace?.name || "Transportes Lujav Workspace"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500 ml-1" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {workspaces.map(ws => (
                <DropdownMenuItem key={ws.id} onClick={() => setCurrentWorkspace(ws)}>
                  <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{ws.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{ws.base}</span>
                </DropdownMenuItem>
              ))}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsCreateWorkspaceOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear nuevo workspace
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Status Icons */}
          <div className="flex items-center gap-3 ml-4 border-l border-gray-200 pl-4">
             <button 
                onClick={() => setIsIAOpen(true)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${isIAOpen ? 'bg-red-50 text-red-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
             >
                <Sparkles className={`h-4 w-4 ${isIAOpen ? 'text-red-600' : 'text-purple-600'}`} />
                <span className={`text-sm font-medium ${isIAOpen ? 'text-red-700' : 'text-gray-600'}`}>IA</span>
             </button>
             <button className="text-gray-400 hover:text-gray-600">
                <Calendar className="h-4 w-4" />
             </button>
             <button className="text-gray-400 hover:text-amber-500">
                <AlertTriangle className="h-4 w-4" />
             </button>
          </div>
        </div>

        {/* Right: Search & User Profile */}
        <div className="flex items-center gap-4">
          
          {/* Quick Actions (Check, Clock, Video) */}
          <div className="flex items-center gap-3 mr-2">
             <button className="text-gray-400 hover:text-green-600">
                <CheckCircle2 className="h-4 w-4" />
             </button>
             <button className="text-gray-400 hover:text-blue-600">
                <Clock className="h-4 w-4" />
             </button>
             <button className="text-gray-400 hover:text-purple-600">
                <Video className="h-4 w-4" />
             </button>
          </div>

          {/* User Avatar with Dropdown */}
          <div className="flex items-center gap-1 cursor-pointer">
             <div className="relative">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User Profile" 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                     {user?.email?.substring(0, 2).toUpperCase() || "TL"}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>

          {/* Search Bar (Pill Shape) */}
          <div className="relative group w-64 hidden sm:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-gray-600" />
             <input 
               type="text" 
               placeholder="Buscar" 
               className="w-full pl-9 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] text-gray-400 mr-1">Ctrl K</span>
                <div className="w-4 h-4 flex items-center justify-center">
                   {/* Colorful icon/sparkle placeholder */}
                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-purple-500">
                     <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                   </svg>
                </div>
             </div>
          </div>

        </div>
      </header>

      <AIChatBot isOpen={isIAOpen} onClose={() => setIsIAOpen(false)} user={user} />

      <Dialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Workspace</DialogTitle>
            <DialogDescription>
              Crea un espacio de trabajo para una base específica y asigna el equipo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Workspace</Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Ej. Operaciones Manzanillo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base">Base Operativa</Label>
              <Select value={newWorkspaceBase} onValueChange={setNewWorkspaceBase}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manzanillo">Manzanillo</SelectItem>
                  <SelectItem value="Puebla">Puebla</SelectItem>
                  <SelectItem value="Altamira">Altamira</SelectItem>
                  <SelectItem value="Veracruz">Veracruz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Equipo de Trabajo</Label>
              <div className="border rounded-md p-2 h-40 overflow-y-auto space-y-2">
                {availableUsers.map(u => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${u.id}`}
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUserSelection(u.id)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor={`user-${u.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2">
                       {u.photoURL ? (
                          <img src={u.photoURL} className="w-5 h-5 rounded-full" />
                       ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">{u.displayName?.charAt(0) || u.email?.charAt(0)}</div>
                       )}
                       {u.displayName || u.email}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateWorkspaceOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateWorkspace}>Crear Workspace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
