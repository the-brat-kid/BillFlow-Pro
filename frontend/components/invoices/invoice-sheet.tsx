"use client";
import { Invoice, BusinessProfile, Customer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { amountInWords } from "@/lib/number-to-words";

interface InvoiceSheetProps {
  invoice: Invoice;
  businessProfile: BusinessProfile;
  customer?: Customer;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100/70 text-emerald-700",
  unpaid: "bg-amber-100/70 text-amber-700",
  partial: "bg-blue-100/70 text-blue-700",
  overdue: "bg-rose-100/70 text-rose-700",
};

export function InvoiceSheet({ invoice, businessProfile, customer }: InvoiceSheetProps) {
  const status = (invoice.status || "unpaid").toLowerCase();
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.unpaid;

  const discountValue = invoice.discount_value || 0;
  const discountAmount =
    invoice.discount_type === "percent" ? invoice.subtotal * (discountValue / 100) : discountValue;

  // Assume a single GST rate for the CGST/SGST split display; falls back
  // gracefully when items have mixed rates by using the blended rate.
  const blendedGstRate = invoice.subtotal > 0 ? (invoice.gst_total / invoice.subtotal) * 100 : 0;
  const halfGst = invoice.gst_total / 2;

  return (
    <main
      className="invoice-sheet bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-12 relative overflow-hidden"
      data-purpose="invoice-container"
    >
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      {/* Header */}
      <section className="border-b border-slate-100 pb-8 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {businessProfile.business_name}
                </h1>
                <span className={`${statusStyle} text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide`}>
                  {status}
                </span>
              </div>
              {businessProfile.business_type && (
                <p className="text-xs text-slate-500 mt-1">{businessProfile.business_type}</p>
              )}
              <p className="text-xs text-slate-400 font-mono-num mt-0.5">Retail Tax Invoice</p>
            </div>
          </div>

          <div className="sm:text-right bg-slate-50/80 sm:bg-transparent p-4 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Invoice Number</span>
            <span className="text-xl font-mono-num font-bold text-slate-900 tracking-tight">
              {invoice.invoice_number}
            </span>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                <span className="text-slate-400">Issue Date:</span>
                <span className="font-medium font-mono-num text-slate-800">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3 text-slate-600">
                <span className="text-slate-400">Due Date:</span>
                <span className="font-medium font-mono-num text-slate-800">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parties */}
      <section className="py-8 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Billed By (Merchant)
            </span>
            <h3 className="text-base font-bold text-slate-900">{businessProfile.business_name}</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">GSTIN:</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono-num text-[11px]">
                  {businessProfile.gst_number || "N/A (Unregistered)"}
                </span>
              </p>
              {businessProfile.address && <p className="text-slate-500">{businessProfile.address}</p>}
            </div>
          </div>

          <div className="space-y-2 sm:pl-6 sm:border-l sm:border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Billed To (Customer)
            </span>
            <h3 className="text-base font-bold text-slate-900">{customer?.name || "Customer Name"}</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">GSTIN:</span>
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono-num text-[11px]">
                  {customer?.gst_number || "N/A"}
                </span>
              </p>
              {customer?.address && <p className="text-slate-500">{customer.address}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Items table */}
      <section className="py-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="pb-3.5 pl-1 w-12 text-center">#</th>
                <th className="pb-3.5 pr-4 font-semibold">Description</th>
                <th className="pb-3.5 px-4 text-center font-semibold w-24">Qty</th>
                <th className="pb-3.5 px-4 text-right font-semibold w-32">Price</th>
                <th className="pb-3.5 px-4 text-center font-semibold w-24">GST %</th>
                <th className="pb-3.5 pr-1 text-right font-semibold w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, i) => {
                const total = item.quantity * item.unit_price * (1 + item.gst_rate / 100);
                return (
                  <tr key={i} className="group hover:bg-slate-50/60 transition">
                    <td className="py-4 pl-1 text-xs text-slate-400 font-mono-num text-center">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-slate-900">{item.description}</div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono-num text-slate-700 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right font-mono-num text-slate-700">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block text-[11px] font-mono-num bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {item.gst_rate}%
                      </span>
                    </td>
                    <td className="py-4 pr-1 text-right font-mono-num font-bold text-slate-900">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Totals + payment info */}
      <section className="border-t border-slate-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-6 space-y-4">
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="font-bold text-slate-700 uppercase tracking-wide">Payment Details</span>
                {status === "paid" && (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    VERIFIED
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Mode</span>
                  <span className="font-semibold text-slate-800">{invoice.payment_method || "Not recorded"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Transaction Status</span>
                  <span className={`font-semibold ${status === "paid" ? "text-emerald-700" : "text-slate-700"}`}>
                    {status === "paid" ? "Fully Settled" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              </div>
              {blendedGstRate > 0 && (
                <p className="text-slate-400 text-[11px] pt-1">
                  * Effective GST rate of {blendedGstRate.toFixed(0)}% includes CGST + SGST as applicable.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/60 text-emerald-900">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <p className="text-xs font-medium">
                Thank you for shopping with <span className="font-bold">{businessProfile.business_name}</span>! Visit
                again soon.
              </p>
            </div>
          </div>

          <div className="md:col-span-6 md:pl-6 space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 py-1">
                <span className="font-medium">Subtotal (Base Price)</span>
                <span className="font-mono-num font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 py-1">
                <span>Central GST (CGST {(blendedGstRate / 2).toFixed(1)}%)</span>
                <span className="font-mono-num text-slate-700">{formatCurrency(halfGst)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 py-1">
                <span>State GST (SGST {(blendedGstRate / 2).toFixed(1)}%)</span>
                <span className="font-mono-num text-slate-700">{formatCurrency(halfGst)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 py-1 border-t border-slate-100">
                <span className="font-medium">GST Total ({blendedGstRate.toFixed(0)}%)</span>
                <span className="font-mono-num font-semibold text-slate-800">{formatCurrency(invoice.gst_total)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between items-center text-slate-600 py-1 border-t border-slate-100">
                  <span className="font-medium">
                    Discount{invoice.discount_type === "percent" ? ` (${discountValue}%)` : ""}
                  </span>
                  <span className="font-mono-num font-semibold text-slate-800">- {formatCurrency(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 text-white rounded-2xl p-5 shadow-lg shadow-rose-500/20 mt-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-medium text-pink-100 uppercase tracking-wider block">Grand Total</span>
                  <span className="text-[11px] text-pink-200 font-medium">Rounded Total Amount</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-mono-num font-extrabold text-white tracking-tight">
                    {formatCurrency(invoice.grand_total)}
                  </div>
                  <div className="text-[10px] text-pink-100 uppercase tracking-widest mt-0.5">INR (Indian Rupee)</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-right italic pt-1">
              Amount in words: <span className="font-medium text-slate-700">{amountInWords(invoice.grand_total)}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
        <div>
          <h4 className="font-bold text-slate-700 text-xs mb-1">Terms &amp; Conditions</h4>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
            {invoice.terms ? (
              <li>{invoice.terms}</li>
            ) : (
              <>
                <li>Goods once sold can be exchanged within 2 days with original invoice.</li>
                <li>Subject to local jurisdiction only. This is a computer generated invoice.</li>
              </>
            )}
          </ul>
        </div>
        <div className="text-center sm:text-right shrink-0">
          <div className="h-12 flex items-end justify-center sm:justify-end">
            <span className="font-serif italic text-base text-slate-700 tracking-wide font-medium">
              {businessProfile.business_name}
            </span>
          </div>
          <div className="border-t border-slate-300 w-40 mt-1 pt-1">
            <span className="text-[11px] font-semibold text-slate-600 block">Authorized Signatory</span>
            <span className="text-[10px] text-slate-400">{businessProfile.business_name}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
