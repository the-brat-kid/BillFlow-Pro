"use client";
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path } from '@react-pdf/renderer';
import { Invoice, BusinessProfile, Customer } from '@/types';
import { amountInWords } from '@/lib/number-to-words';

// --- Palette matched to the on-screen invoice sheet -------------------
const INK = '#0F172A';       // slate-900
const SUBTLE = '#94A3B8';    // slate-400
const MUTED = '#64748B';     // slate-500
const BODY = '#475569';      // slate-600
const LINE = '#F1F5F9';      // slate-100
const PANEL = '#F8FAFC';     // slate-50
const EMERALD = '#059669';
const EMERALD_BG = '#ECFDF5';
const EMERALD_BORDER = '#D1FAE5';
const ROSE = '#E11D48';
const ROSE_LIGHT = '#F43F5E';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: '#D1FAE5', text: '#047857' },
  unpaid: { bg: '#FEF3C7', text: '#B45309' },
  partial: { bg: '#DBEAFE', text: '#1D4ED8' },
  overdue: { bg: '#FFE4E6', text: '#BE123C' },
};

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 9, fontFamily: 'Helvetica', color: INK },
  topBar: { height: 6, backgroundColor: EMERALD, width: '100%' },
  content: { padding: 36 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: LINE },
  brandRow: { flexDirection: 'row', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: EMERALD_BG, borderWidth: 1, borderColor: EMERALD_BORDER, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  businessNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  businessName: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  statusPill: { fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, marginLeft: 6 },
  subLine: { fontSize: 8, color: MUTED, marginTop: 3 },
  mutedLine: { fontSize: 7.5, color: SUBTLE, marginTop: 2 },

  metaBox: { alignItems: 'flex-end' },
  metaTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: SUBTLE, letterSpacing: 1 },
  metaInvoiceNo: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 2, marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 1 },
  metaLabel: { fontSize: 7.5, color: SUBTLE, marginRight: 6 },
  metaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  partiesRow: { flexDirection: 'row', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: LINE },
  partyCol: { flex: 1 },
  partyColRight: { flex: 1, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: LINE },
  partyLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SUBTLE, letterSpacing: 0.5, marginBottom: 4 },
  partyName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  gstRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  gstLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginRight: 5 },
  gstBadge: { fontSize: 7, backgroundColor: PANEL, color: BODY, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  partyAddr: { fontSize: 8, color: MUTED },

  table: { marginTop: 18 },
  tHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 7, marginBottom: 4 },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: SUBTLE, letterSpacing: 0.5 },
  tRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: LINE, alignItems: 'center' },
  colIdx: { width: '6%', textAlign: 'center', fontSize: 8, color: SUBTLE },
  colDesc: { width: '38%', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  colQty: { width: '14%', textAlign: 'center', fontSize: 8.5 },
  colPrice: { width: '16%', textAlign: 'right', fontSize: 8.5 },
  colGst: { width: '12%', alignItems: 'center' },
  gstChip: { fontSize: 7, backgroundColor: PANEL, color: BODY, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  colTotal: { width: '14%', textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold' },

  bottomRow: { flexDirection: 'row', marginTop: 22, gap: 20 },
  leftCol: { flex: 1 },
  rightCol: { flex: 1 },

  paymentPanel: { backgroundColor: PANEL, borderRadius: 10, borderWidth: 1, borderColor: '#F1F5F9', padding: 12 },
  paymentHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 7, marginBottom: 7, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  paymentHeadLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: BODY, letterSpacing: 0.5 },
  verifiedPill: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: EMERALD, backgroundColor: EMERALD_BG, borderWidth: 0.5, borderColor: EMERALD_BORDER, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  paymentGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentLabel: { fontSize: 7, color: SUBTLE, marginBottom: 2 },
  paymentValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: BODY },
  paymentNote: { fontSize: 7, color: SUBTLE, marginTop: 8 },

  thanksBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderWidth: 0.5, borderColor: '#D1FAE5', borderRadius: 8, padding: 8, marginTop: 10 },
  thanksText: { fontSize: 8, color: '#065F46' },

  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5 },
  totalsRowBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5, borderTopWidth: 0.5, borderTopColor: LINE, marginTop: 2 },
  totalsLabel: { fontSize: 8, color: BODY },
  totalsValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BODY },

  grandBox: { backgroundColor: ROSE, borderRadius: 10, padding: 14, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  grandLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#FFE4E6', letterSpacing: 0.5 },
  grandSub: { fontSize: 6.5, color: '#FFE4E6', marginTop: 1 },
  grandValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  grandCurrency: { fontSize: 6.5, color: '#FFE4E6', textAlign: 'right', marginTop: 2, letterSpacing: 0.5 },

  amountWords: { fontSize: 7.5, color: MUTED, textAlign: 'right', marginTop: 8, fontFamily: 'Helvetica-Oblique' },
  amountWordsBold: { fontFamily: 'Helvetica-Bold', color: BODY },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: LINE },
  termsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BODY, marginBottom: 3 },
  termsLine: { fontSize: 7, color: SUBTLE, marginBottom: 1.5 },
  sigName: { fontSize: 10, fontFamily: 'Helvetica-Oblique', color: BODY, marginBottom: 6 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: '#CBD5E1', width: 130, paddingTop: 4 },
  sigLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BODY },
  sigSub: { fontSize: 6.5, color: SUBTLE },
});

const money = (n: number) => `Rs. ${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface InvoicePDFProps {
  invoice: Invoice;
  businessProfile: BusinessProfile;
  customer?: Customer;
}

export const InvoicePDF = ({ invoice, businessProfile, customer }: InvoicePDFProps) => {
  const status = (invoice.status || 'unpaid').toLowerCase();
  const statusColors = STATUS_COLORS[status] || STATUS_COLORS.unpaid;

  const discountValue = invoice.discount_value || 0;
  const discountAmount = invoice.discount_type === 'percent'
    ? invoice.subtotal * (discountValue / 100)
    : discountValue;

  const blendedGstRate = invoice.subtotal > 0 ? (invoice.gst_total / invoice.subtotal) * 100 : 0;
  const halfGst = invoice.gst_total / 2;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />
        <View style={styles.content}>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.iconBox}>
                <Svg width="18" height="18" viewBox="0 0 24 24">
                  <Path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke={EMERALD} strokeWidth={1.8} fill="none" />
                </Svg>
              </View>
              <View>
                <View style={styles.businessNameRow}>
                  <Text style={styles.businessName}>{businessProfile.business_name}</Text>
                  <Text style={[styles.statusPill, { backgroundColor: statusColors.bg, color: statusColors.text }]}>
                    {status.toUpperCase()}
                  </Text>
                </View>
                {businessProfile.business_type ? <Text style={styles.subLine}>{businessProfile.business_type}</Text> : null}
                <Text style={styles.mutedLine}>Retail Tax Invoice</Text>
              </View>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaTitle}>INVOICE NUMBER</Text>
              <Text style={styles.metaInvoiceNo}>{invoice.invoice_number}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Issue Date:</Text>
                <Text style={styles.metaValue}>{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Due Date:</Text>
                <Text style={styles.metaValue}>{new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
          </View>

          {/* Parties */}
          <View style={styles.partiesRow}>
            <View style={styles.partyCol}>
              <Text style={styles.partyLabel}>BILLED BY (MERCHANT)</Text>
              <Text style={styles.partyName}>{businessProfile.business_name}</Text>
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>GSTIN:</Text>
                <Text style={styles.gstBadge}>{businessProfile.gst_number || 'N/A (Unregistered)'}</Text>
              </View>
              {businessProfile.address ? <Text style={styles.partyAddr}>{businessProfile.address}</Text> : null}
            </View>
            <View style={styles.partyColRight}>
              <Text style={styles.partyLabel}>BILLED TO (CUSTOMER)</Text>
              <Text style={styles.partyName}>{customer?.name || 'Customer Name'}</Text>
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>GSTIN:</Text>
                <Text style={styles.gstBadge}>{customer?.gst_number || 'N/A'}</Text>
              </View>
              {customer?.address ? <Text style={styles.partyAddr}>{customer.address}</Text> : null}
            </View>
          </View>

          {/* Items table */}
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.th, styles.colIdx]}>#</Text>
              <Text style={[styles.th, styles.colDesc]}>DESCRIPTION</Text>
              <Text style={[styles.th, styles.colQty]}>QTY</Text>
              <Text style={[styles.th, styles.colPrice]}>PRICE</Text>
              <Text style={[styles.th, { width: '12%', textAlign: 'center' }]}>GST %</Text>
              <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
            </View>
            {invoice.items.map((item, i) => {
              const total = item.quantity * item.unit_price * (1 + item.gst_rate / 100);
              return (
                <View style={styles.tRow} key={i}>
                  <Text style={styles.colIdx}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={styles.colDesc}>{item.description}</Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{money(item.unit_price)}</Text>
                  <View style={styles.colGst}>
                    <Text style={styles.gstChip}>{item.gst_rate}%</Text>
                  </View>
                  <Text style={styles.colTotal}>{money(total)}</Text>
                </View>
              );
            })}
          </View>

          {/* Payment + Totals */}
          <View style={styles.bottomRow}>
            <View style={styles.leftCol}>
              <View style={styles.paymentPanel}>
                <View style={styles.paymentHeadRow}>
                  <Text style={styles.paymentHeadLabel}>PAYMENT DETAILS</Text>
                  {status === 'paid' && <Text style={styles.verifiedPill}>VERIFIED</Text>}
                </View>
                <View style={styles.paymentGrid}>
                  <View>
                    <Text style={styles.paymentLabel}>Payment Mode</Text>
                    <Text style={styles.paymentValue}>{invoice.payment_method || 'Not recorded'}</Text>
                  </View>
                  <View>
                    <Text style={styles.paymentLabel}>Transaction Status</Text>
                    <Text style={{ ...styles.paymentValue, ...(status === 'paid' ? { color: EMERALD } : {}) }}>
                      {status === 'paid' ? 'Fully Settled' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                </View>
                {blendedGstRate > 0 && (
                  <Text style={styles.paymentNote}>
                    * Effective GST rate of {blendedGstRate.toFixed(0)}% includes CGST + SGST as applicable.
                  </Text>
                )}
              </View>

              <View style={styles.thanksBox}>
                <Text style={styles.thanksText}>
                  Thank you for shopping with {businessProfile.business_name}! Visit again soon.
                </Text>
              </View>
            </View>

            <View style={styles.rightCol}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal (Base Price)</Text>
                <Text style={styles.totalsValue}>{money(invoice.subtotal)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Central GST (CGST {(blendedGstRate / 2).toFixed(1)}%)</Text>
                <Text style={styles.totalsValue}>{money(halfGst)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>State GST (SGST {(blendedGstRate / 2).toFixed(1)}%)</Text>
                <Text style={styles.totalsValue}>{money(halfGst)}</Text>
              </View>
              <View style={styles.totalsRowBorder}>
                <Text style={styles.totalsLabel}>GST Total ({blendedGstRate.toFixed(0)}%)</Text>
                <Text style={styles.totalsValue}>{money(invoice.gst_total)}</Text>
              </View>
              {discountValue > 0 && (
                <View style={styles.totalsRowBorder}>
                  <Text style={styles.totalsLabel}>
                    Discount{invoice.discount_type === 'percent' ? ` (${discountValue}%)` : ''}
                  </Text>
                  <Text style={styles.totalsValue}>- {money(discountAmount)}</Text>
                </View>
              )}

              <View style={styles.grandBox}>
                <View>
                  <Text style={styles.grandLabel}>GRAND TOTAL</Text>
                  <Text style={styles.grandSub}>Rounded Total</Text>
                </View>
                <View>
                  <Text style={styles.grandValue}>{money(invoice.grand_total)}</Text>
                  <Text style={styles.grandCurrency}>INR (INDIAN RUPEE)</Text>
                </View>
              </View>

              <Text style={styles.amountWords}>
                Amount in words: <Text style={styles.amountWordsBold}>{amountInWords(invoice.grand_total)}</Text>
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={{ maxWidth: 280 }}>
              <Text style={styles.termsTitle}>Terms &amp; Conditions</Text>
              {invoice.terms ? (
                <Text style={styles.termsLine}>{invoice.terms}</Text>
              ) : (
                <>
                  <Text style={styles.termsLine}>• Goods once sold can be exchanged within 2 days with original invoice.</Text>
                  <Text style={styles.termsLine}>• Subject to local jurisdiction only. This is a computer generated invoice.</Text>
                </>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.sigName}>{businessProfile.business_name}</Text>
              <View style={styles.sigLine}>
                <Text style={styles.sigLabel}>Authorized Signatory</Text>
                <Text style={styles.sigSub}>{businessProfile.business_name}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
