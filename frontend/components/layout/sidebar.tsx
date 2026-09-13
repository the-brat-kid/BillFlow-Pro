"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Package, FileText, IndianRupee, BarChart3, Settings, BrainCircuit } from "lucide-react";

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: IndianRupee },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai", label: "AI Insights", icon: BrainCircuit },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col bg-card border-r", isMobile ? "w-full" : "w-64")}>
      {!isMobile && (
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-primary">BillFlow Pro</span>
        </div>
      )}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {routes.map((route) => {
          const active = pathname.startsWith(route.href);
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {route.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}