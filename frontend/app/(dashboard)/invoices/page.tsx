// @ts-nocheck
"use client";
import Link from "next/link";
import { useInvoices } from "@/hooks/use-invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Mail, Eye, Search, Receipt, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

const statusStyles: Record<string, string> = {
  paid: "bg-stitch-tertiary/15 text-stitch-tertiary",
  unpaid: "bg-stitch-error-container/40 text-stitch-error",
  partial: "bg-stitch-secondary-container/20 text-stitch-secondary-container",
  pending: "bg-stitch-secondary-container/20 text-stitch-secondary-container",
};

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const [search, setSearch] = useState("");

  const handleSendEmail = async (invoiceId: string, defaultEmail?: string) => {
    const customerEmail = window.prompt("Enter customer email address to send this invoice:", defaultEmail || "");
    if (!customerEmail) return;

    try {
      const token = localStorage.getItem("access_token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBaseUrl}/api/v1/invoices/${invoiceId}/send-email?email=${customerEmail}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Invoice email dispatch started in the background!");
      } else {
        alert("Failed to send email. Check backend logs.");
      }
    } catch (error) {
      console.error("Email error:", error);
      alert("An error occurred while sending the email.");
    }
  };

  const stats = useMemo(() => {
    const list = invoices || [];
    const total = list.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
    const paid = list.filter((inv: any) => inv.status === "paid");
    const paidAmount = paid.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
    const pending = list.filter((inv: any) => inv.status !== "paid");
    const pendingAmount = pending.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
    return {
      count: list.length,
      total,
      paidCount: paid.length,
      paidAmount,
      pendingCount: pending.length,
      pendingAmount,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((inv: any) =>
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  return (
    <div className="bg-stitch-background -m-6 p-6 min-h-screen font-stitch-body">
      <div className="flex flex-col gap-space-xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-sm">
              <span className="font-stitch-heading text-[32px] leading-[40px] font-bold text-stitch-on-background tracking-tight">Invoices &amp; Billing</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stitch-surface-container-high text-stitch-tertiary text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-stitch-tertiary animate-pulse" />
                {stats.count} Invoices
              </span>
            </div>
            <p className="text-sm text-stitch-on-surface-variant">Manage billing, payment status, and customer receipts.</p>
          </div>
          <Link href="/invoices/new">
            <button className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-stitch-primary-container hover:bg-stitch-primary text-stitch-on-primary font-semibold text-sm shadow-[0_0_16px_rgba(128,131,255,0.3)] transition-all">
              <Plus className="w-[18px] h-[18px]" />
              <span>Create Invoice</span>
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-stitch-surface-container-low shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stitch-outline">Total Invoiced</span>
              <div className="w-8 h-8 rounded-lg bg-stitch-primary-container/20 flex items-center justify-center text-stitch-primary">
                <Receipt className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-stitch-heading text-2xl font-bold text-stitch-on-background">{formatCurrency(stats.total)}</span>
              <p className="text-xs text-stitch-on-surface-variant mt-1">Across {stats.count} invoices</p>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-stitch-surface-container-low shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stitch-outline">Collected &amp; Paid</span>
              <div className="w-8 h-8 rounded-lg bg-stitch-tertiary-container/20 flex items-center justify-center text-stitch-tertiary">
                <CheckCircle2 className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-stitch-heading text-2xl font-bold text-stitch-on-background">{formatCurrency(stats.paidAmount)}</span>
              <p className="text-xs text-stitch-on-surface-variant mt-1">{stats.paidCount} invoices settled</p>
            </div>
          </div>
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-stitch-surface-container-low shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stitch-outline">Pending / Unpaid</span>
              <div className="w-8 h-8 rounded-lg bg-stitch-error-container/40 flex items-center justify-center text-stitch-error">
                <Clock className="w-[18px] h-[18px]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="font-stitch-heading text-2xl font-bold text-stitch-on-background">{formatCurrency(stats.pendingAmount)}</span>
              <p className="text-xs text-stitch-on-surface-variant mt-1">{stats.pendingCount} invoices pending</p>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-stitch-surface-container-low shadow-sm">
          <div className="relative flex-1">
            <Search className="w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-stitch-outline" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-stitch-surface-container-lowest text-stitch-on-background placeholder:text-stitch-outline text-sm focus:outline-none"
              placeholder="Search invoice # or customer..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col rounded-xl overflow-hidden bg-stitch-surface-container-low shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stitch-surface-container-lowest/80 text-stitch-outline uppercase text-[11px] font-bold tracking-wider">
                  <th className="py-space-sm px-space-md">Invoice ID</th>
                  <th className="py-space-sm px-space-md">Customer</th>
                  <th className="py-space-sm px-space-md">Issue Date</th>
                  <th className="py-space-sm px-space-md">Due Date</th>
                  <th className="py-space-sm px-space-md text-right">Amount</th>
                  <th className="py-space-sm px-space-md">Status</th>
                  <th className="py-space-sm px-space-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-stitch-on-background text-sm divide-y divide-stitch-surface-container-highest/30">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-space-lg text-center text-stitch-on-surface-variant">Loading...</td>
                  </tr>
                )}
                {!isLoading && filtered.map((inv: any) => {
                  const isOverdue = inv.status !== "paid" && inv.due_date && new Date(inv.due_date) < new Date();
                  const status = isOverdue ? "unpaid" : (inv.status || "unknown");
                  return (
                    <tr key={inv.id} className="hover:bg-stitch-surface-container transition-colors">
                      <td className="py-space-sm px-space-md whitespace-nowrap">
                        <span className="font-semibold text-stitch-primary">{inv.invoice_number}</span>
                      </td>
                      <td className="py-space-sm px-space-md whitespace-nowrap">
                        <span className="text-stitch-on-background">{inv.customer?.name || "—"}</span>
                      </td>
                      <td className="py-space-sm px-space-md whitespace-nowrap text-stitch-on-surface-variant">{formatDate(inv.date)}</td>
                      <td className={`py-space-sm px-space-md whitespace-nowrap ${isOverdue ? "text-stitch-error" : "text-stitch-on-surface-variant"}`}>
                        {formatDate(inv.due_date)}{isOverdue && " (overdue)"}
                      </td>
                      <td className="py-space-sm px-space-md whitespace-nowrap text-right font-mono font-bold">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="py-space-sm px-space-md whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || "bg-stitch-surface-container-highest text-stitch-on-surface-variant"}`}>
                          {isOverdue && <AlertTriangle className="w-3 h-3" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="py-space-sm px-space-md whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSendEmail(inv.id, inv.customer?.email)}
                            title="Send via Email"
                            className="p-1.5 rounded-lg text-stitch-outline hover:text-stitch-on-background hover:bg-stitch-surface-container-high transition-colors"
                          >
                            <Mail className="w-[18px] h-[18px]" />
                          </button>
                          <Link href={`/invoices/${inv.id}`} className="p-1.5 rounded-lg text-stitch-outline hover:text-stitch-on-background hover:bg-stitch-surface-container-high transition-colors inline-flex">
                            <Eye className="w-[18px] h-[18px]" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-space-lg text-center text-stitch-on-surface-variant">No invoices found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}