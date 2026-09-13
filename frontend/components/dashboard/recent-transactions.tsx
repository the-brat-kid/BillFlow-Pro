"use client";
import { Eye } from "lucide-react";
import { useRecentTransactions } from "@/hooks/use-dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const statusStyles: Record<string, string> = {
  paid: "bg-stitch-tertiary/15 text-stitch-tertiary",
  unpaid: "bg-stitch-error-container/40 text-stitch-error",
  partial: "bg-stitch-secondary-container/15 text-stitch-secondary-container",
};

export function RecentTransactions() {
  const { data: transactions, isLoading } = useRecentTransactions();

  return (
    <div className="flex flex-col rounded-xl bg-stitch-surface-container shadow-md overflow-hidden font-stitch-body">
      <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h2 className="font-stitch-heading text-xl font-semibold text-stitch-on-background tracking-tight">Recent Transactions</h2>
          <p className="text-sm text-stitch-on-surface-variant">Live ledger of recent invoices</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stitch-surface-container-low text-stitch-outline text-[11px] font-bold uppercase tracking-wider">
              <th className="py-space-sm px-space-lg">Invoice</th>
              <th className="py-space-sm px-space-md">Customer</th>
              <th className="py-space-sm px-space-md">Date</th>
              <th className="py-space-sm px-space-md text-right">Amount</th>
              <th className="py-space-sm px-space-md text-center">Status</th>
              <th className="py-space-sm px-space-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stitch-surface-container-highest/40 text-stitch-on-background">
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-space-lg text-center text-stitch-on-surface-variant">Loading...</td>
              </tr>
            )}
            {!isLoading && transactions?.map((t) => (
              <tr key={t.invoice_id} className="hover:bg-stitch-surface-container-high/60 transition-colors">
                <td className="py-space-md px-space-lg font-mono font-semibold text-stitch-primary">
                  {t.invoice_number}
                </td>
                <td className="py-space-md px-space-md">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-7 h-7 rounded-full bg-stitch-secondary/20 text-stitch-secondary flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      {initials(t.customer_name || "?")}
                    </div>
                    <span className="text-sm text-stitch-on-background truncate">{t.customer_name}</span>
                  </div>
                </td>
                <td className="py-space-md px-space-md text-stitch-on-surface-variant text-xs">
                  {formatDate(t.date)}
                </td>
                <td className="py-space-md px-space-md text-right font-mono font-bold text-stitch-on-background">
                  {formatCurrency(t.amount)}
                </td>
                <td className="py-space-md px-space-md text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[t.status] || "bg-stitch-surface-container-highest text-stitch-on-surface-variant"}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </td>
                <td className="py-space-md px-space-lg text-right">
                  <Link href={`/invoices/${t.invoice_id}`} className="inline-flex p-1.5 rounded hover:bg-stitch-surface-container-highest text-stitch-on-surface-variant hover:text-stitch-on-background transition-colors">
                    <Eye className="w-[18px] h-[18px]" />
                  </Link>
                </td>
              </tr>
            ))}
            {!isLoading && (!transactions || transactions.length === 0) && (
              <tr>
                <td colSpan={6} className="py-space-lg text-center text-stitch-on-surface-variant">No recent transactions</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}