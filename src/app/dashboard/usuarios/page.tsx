 "use client";

 import { useEffect, useMemo, useState } from "react";
 import { db, auth } from "@/lib/firebase";
 import {
   collection,
   onSnapshot,
   orderBy,
   query,
   updateDoc,
   doc,
 } from "firebase/firestore";
 import { onAuthStateChanged } from "firebase/auth";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import {
   Users,
   Shield,
   Mail,
   Calendar,
   Search,
   ShieldAlert,
 } from "lucide-react";
 import { format } from "date-fns";
 import { es } from "date-fns/locale";
 import { toast } from "sonner";

 type Role = "admin" | "user";

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
   const [isAdmin, setIsAdmin] = useState(false);

   const getInitials = (user: UserRow) => {
     if (user.displayName) {
       return user.displayName.slice(0, 2).toUpperCase();
     }
     if (user.email) {
       return user.email.slice(0, 2).toUpperCase();
     }
     return "US";
   };

   useEffect(() => {
     if (!auth || !db) {
       setLoading(false);
       return;
     }

     const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
       if (!currentUser) {
         setCurrentUserId(null);
         setIsAdmin(false);
         return;
       }
       setCurrentUserId(currentUser.uid);
       try {
         const userRef = doc(db!, "users", currentUser.uid);
         const snap = await import("firebase/firestore").then(({ getDoc }) =>
           getDoc(userRef),
         );
         if (snap.exists() && snap.data()?.role === "admin") {
           setIsAdmin(true);
         } else {
           setIsAdmin(false);
         }
       } catch (error) {
         console.error("Error checking admin role", error);
       }
     });

     return () => {
       unsubscribeAuth();
     };
   }, []);

   useEffect(() => {
     if (!db) {
       setLoading(false);
       return;
     }

     const q = query(collection(db!, "users"), orderBy("createdAt", "desc"));
     const unsubscribe = onSnapshot(
       q,
       (snapshot) => {
         const items: UserRow[] = snapshot.docs.map((docSnap) => {
           const data = docSnap.data() as any;
           return {
             id: docSnap.id,
             uid: data.uid || docSnap.id,
             displayName: data.displayName || data.email || "Usuario",
             email: data.email || "",
             photoURL: data.photoURL,
             role: (data.role as Role) || "user",
             status: data.status,
             createdAt: data.createdAt,
             lastLogin: data.lastLogin,
           };
         });
         setUsers(items);
         setLoading(false);
       },
       (error) => {
         console.error("Error loading users", error);
         toast.error("No se pudieron cargar los usuarios");
         setLoading(false);
       },
     );

     return () => unsubscribe();
   }, []);

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

   const handleChangeRole = async (userId: string, role: Role) => {
     if (!db) return;
     try {
       await updateDoc(doc(db!, "users", userId), { role });
       toast.success("Rol actualizado");
     } catch (error) {
       console.error("Error updating role", error);
       toast.error("No se pudo actualizar el rol");
     }
   };

   const formatDate = (value?: any) => {
     if (!value) return "-";
     try {
       if (value.toDate) {
         return format(value.toDate(), "dd MMM yyyy, HH:mm", { locale: es });
       }
       return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: es });
     } catch {
       return "-";
     }
   };

   if (!isAdmin && currentUserId) {
     return (
       <div className="h-full flex items-center justify-center">
         <div className="text-center space-y-3">
           <ShieldAlert className="w-10 h-10 mx-auto text-red-500" />
           <h1 className="text-lg font-semibold text-gray-900">
             No tienes permisos para ver usuarios
           </h1>
           <p className="text-sm text-gray-500 max-w-sm mx-auto">
             Solo los administradores pueden gestionar la lista de usuarios.
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
               Administra los usuarios registrados y sus roles dentro de la
               plataforma.
             </p>
           </div>
           <div className="flex items-center gap-2">
             <Badge variant="outline" className="gap-1">
               <Shield className="w-3 h-3" />
               Admin
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
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col justify-between"
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
                            variant={user.role === "admin" ? "default" : "outline"}
                            className={
                              "text-[11px] px-2 py-0.5 " +
                              (user.role === "admin"
                                ? "bg-black text-white"
                                : "text-gray-700 border-gray-300")
                            }
                          >
                            {user.role === "admin" ? "Admin" : "Usuario"}
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
                          <span>Último acceso: {formatDate(user.lastLogin)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Badge
                      variant="outline"
                      className={
                        user.status === "active"
                          ? "border-green-200 text-green-700"
                          : "border-gray-200 text-gray-500"
                      }
                    >
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                    {user.id !== currentUserId && (
                      <div className="flex flex-wrap justify-start sm:justify-end gap-2">
                        {user.role === "admin" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2"
                            onClick={() => handleChangeRole(user.id, "user")}
                          >
                            Quitar admin
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2"
                            onClick={() => handleChangeRole(user.id, "admin")}
                          >
                            Hacer admin
                          </Button>
                        )}
                      </div>
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
