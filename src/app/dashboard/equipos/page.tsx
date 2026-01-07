"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Briefcase, MapPin, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Workspace {
  id: string;
  name: string;
  base: string;
  members: string[];
  createdBy: string;
  createdAt: any;
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export default function EquiposPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Users first to map IDs to data
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersMap: Record<string, UserData> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        usersMap[doc.id] = {
            uid: doc.id,
            displayName: data.displayName || data.email,
            email: data.email,
            photoURL: data.photoURL
        };
      });
      setUsers(usersMap);
    });

    // Fetch Workspaces
    const q = query(collection(db, "workspaces"), orderBy("createdAt", "desc"));
    const unsubscribeWorkspaces = onSnapshot(q, (snapshot) => {
      const wsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workspace[];
      setWorkspaces(wsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workspaces:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeWorkspaces();
    };
  }, []);

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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => (
          <Card key={ws.id} className="hover:shadow-lg transition-shadow">
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
                  <div className="flex -space-x-2 overflow-hidden py-1">
                    {ws.members && ws.members.length > 0 ? (
                      ws.members.slice(0, 5).map((memberId) => {
                        const user = users[memberId];
                        return (
                          <Avatar key={memberId} className="inline-block border-2 border-white w-8 h-8">
                            <AvatarImage src={user?.photoURL} />
                            <AvatarFallback className="bg-gray-200 text-[10px] text-gray-600">
                              {user?.displayName?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })
                    ) : (
                      <span className="text-sm text-gray-400 italic">Sin miembros asignados</span>
                    )}
                    {ws.members && ws.members.length > 5 && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-gray-100 text-[10px] font-medium text-gray-500">
                        +{ws.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Creado por:</span>
                    <span>{users[ws.createdBy]?.displayName || "Desconocido"}</span>
                  </div>
                  <div className="flex items-center gap-1" title={ws.createdAt?.toDate().toLocaleString()}>
                    <Calendar className="h-3 w-3" />
                    {ws.createdAt?.seconds ? format(ws.createdAt.toDate(), "d MMM, yyyy", { locale: es }) : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-gray-200 bg-gray-50/50">
            <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No hay workspaces creados</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              Los administradores pueden crear nuevos espacios de trabajo desde la barra superior.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
