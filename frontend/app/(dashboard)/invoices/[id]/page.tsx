"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInvoice, useUpdateInvoiceStatus } from "@/hooks/use-invoices";
import { useBusinessProfile } from "@/hooks/use-business-profile";
import { useCustomers } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { PaymentQR } from "@/components/invoices/payment-qr";
import { InvoiceSheet } from "@/components/invoices/invoice-sheet";
import { formatCurrency } from "@/lib/utils";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoices/invoice-pdf";
import { Download, Printer, ArrowLeft, CheckCircle2, Banknote, QrCode, Loader2 } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  unpaid: "bg-amber-100 text-amber-700 border-amber-200",
  partial: "bg-blue-100 text-blue-700 border-blue-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function InvoiceDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: profile } = useBusinessProfile();
  const { data: customers } = useCustomers();
  const { mutateAsync: updateStatus } = useUpdateInvoiceStatus();
  const [isClient, setIsClient] = useState(false);
  const [showUpiQR, setShowUpiQR] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading invoice...
      </div>
    );
  }
  if (!invoice) return <div className="py-24 text-center text-muted-foreground">Invoice not found</div>;

  const customer = customers?.find(c => c.id === invoice.customer_id);
  const status = invoice.status || "unpaid";
  const badgeStyle = STATUS_BADGE[status] || STATUS_BADGE.unpaid;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="no-print space-y-4">
        <button
          onClick={() => router.push("/invoices")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Invoice {invoice.invoice_number}
            </h1>
            <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${badgeStyle}`}>
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Button variant="outline" className="rounded-lg" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            {isClient && profile && (
              <PDFDownloadLink
                document={<InvoicePDF invoice={invoice} businessProfile={profile} customer={customer} />}
                fileName={`Invoice-${invoice.invoice_number}.pdf`}
              >
                <Button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Invoice sheet */}
        <div className="md:col-span-2 space-y-6">
          {profile && <InvoiceSheet invoice={invoice} businessProfile={profile} customer={customer} />}
        </div>

        {/* Payment panel */}
        <div className="no-print md:sticky md:top-6">
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Payment</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {status === "paid" ? "This invoice has been settled" : "Record how the customer pays"}
              </p>
            </div>

            <div className="p-6">
              {status === "paid" ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center gap-2 py-8 px-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                    <div className="font-bold text-emerald-800">Payment Received</div>
                    <div className="text-xs text-emerald-600">{formatCurrency(invoice.grand_total)} settled</div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-slate-700"
                    onClick={() => { setShowUpiQR(false); updateStatus({ id: invoice.id, status: "unpaid" }); }}
                  >
                    Mark as Unpaid
                  </Button>
                </div>
              ) : !showUpiQR ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="h-16 flex-col gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => updateStatus({ id: invoice.id, status: "paid" })}
                    >
                      <Banknote className="h-5 w-5" />
                      <span className="text-xs font-semibold">Cash</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-16 flex-col gap-1.5 rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                      onClick={() => setShowUpiQR(true)}
                    >
                      <QrCode className="h-5 w-5" />
                      <span className="text-xs font-semibold">UPI</span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-slate-700"
                    onClick={() => updateStatus({ id: invoice.id, status: "unpaid" })}
                  >
                    Mark as Unpaid
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <PaymentQR amount={invoice.grand_total} invoiceNumber={invoice.invoice_number} />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Ask the customer to scan and pay. Once payment is received, confirm below.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setShowUpiQR(false)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => updateStatus({ id: invoice.id, status: "paid" })}
                    >
                      OK, Payment Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
