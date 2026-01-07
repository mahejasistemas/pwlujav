"use client";

import { useEffect } from "react";
import InicioPage from "../pages/inico";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function DashboardPage() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid === "vOMCMqNTf6YOyicvAXiB0TJ8Ei52") {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists() && userDoc.data().role !== "admin") {
            await updateDoc(userRef, {
              role: "admin"
            });
            toast.success("Permisos de administrador concedidos automáticamente");
            // Force reload to apply changes if needed, or let the state update naturally
          }
        } catch (error) {
          console.error("Error granting admin permissions:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="h-full w-full">
      <InicioPage />
    </div>
  );
}
