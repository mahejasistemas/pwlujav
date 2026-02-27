"use client";

import { useEffect } from "react";
import InicioPage from "../pages/inicio";
import { toast } from "sonner";

export default function DashboardPage() {
  useEffect(() => {
    // Firebase admin grant logic removed
  }, []);

  return (
    <div className="h-full w-full">
      <InicioPage />
    </div>
  );
}
