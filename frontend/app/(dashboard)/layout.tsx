"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      
      {/* Sidebar Drawer (Jab 3-line button dabayenge tabhi khulega) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop (Sidebar ke bahar click karne par close ho jayega) */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar Content Box */}
          <div className="relative flex w-64 flex-col bg-background z-10 shadow-2xl border-r">
            {/* Close Button Inside Sidebar */}
            <div className="flex justify-end p-3 border-b">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted text-foreground text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        
        {/* Top Bar jisme 3-Line Menu Button hoga */}
        <div className="flex items-center px-4 py-3 border-b bg-background gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors focus:outline-none"
            aria-label="Open Sidebar"
          >
            {/* 3-Line Hamburger Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1">
            <Header />
          </div>
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}