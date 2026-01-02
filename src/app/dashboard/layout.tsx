"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AIChatBot from "@/components/AIChatBot";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-20 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <AIChatBot />
    </div>
  );
}
