"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fix for aria-hidden issue where focus is trapped inside a hidden element
  useEffect(() => {
    const layout = document.getElementById("dashboard-layout");
    if (!layout) return;

    // Use MutationObserver to aggressively remove aria-hidden as soon as it's added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-hidden"
        ) {
          const isHidden = layout.getAttribute("aria-hidden") === "true";
          // Only remove if it's causing issues (focus is inside) or just always remove for now
          // For safety in this specific case, we'll remove it if focus is inside
          if (isHidden && layout.contains(document.activeElement)) {
            console.warn("Removing aria-hidden from layout to prevent focus trap");
            layout.removeAttribute("aria-hidden");
          }
        }
      });
    });

    observer.observe(layout, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div id="dashboard-layout" className="flex min-h-screen bg-gray-50">
      {/* Sidebar (Fixed Left) */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-[72px]">
        {/* Navbar (Top) */}
        <Navbar />
        
        {/* Page Content (Scrollable) */}
        <main className="flex-1 bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
