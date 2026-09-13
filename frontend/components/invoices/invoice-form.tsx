// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { useProducts } from "@/hooks/use-products";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, QrCode, Banknote, Clock, Info, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PaymentQR } from "@/components/invoices/payment-qr";

export function InvoiceForm() {
  const router = useRouter();
  const { businessProfile } = useAuth();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { mutateAsync: createInvoice } = useCreateInvoice();
  const { toast } = useToast();

  // Workflow State
  const [step, setStep] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [upiPaymentConfirmed, setUpiPaymentConfirmed] = useState(false);

  // Invoice State
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);

  const [items, setItems] = useState([
    { id: Date.now().toString(), product_id: "", description: "", quantity: 1, unit_price: 0, gst_rate: 18 }
  ]);

  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const calculateGstTotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.gst_rate / 100)), 0);
  const subtotal = calculateSubtotal();
  const gstTotal = calculateGstTotal();
  const grandTotal = subtotal + gstTotal - discount;

  const addItem = () => setItems([...items, { id: Date.now().toString(), product_id: "", description: "", quantity: 1, unit_price: 0, gst_rate: 18 }]);
  const removeItem = (id: string) => setItems(items.filter(item => item.id !== id));

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'product_id' && products) {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.description = product.name;
            updated.unit_price = product.price;
            updated.gst_rate = product.gst_rate;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleNextStep = () => {
    if (!customerId) return toast({ title: "Validation Error", description: "Please select a customer", variant: "destructive" });
    if (items.length === 0) return toast({ title: "Validation Error", description: "Please add at least one item", variant: "destructive" });
    if (items.some(item => !item.description || item.unit_price <= 0)) {
      return toast({ title: "Validation Error", description: "Please complete all item details", variant: "destructive" });
    }
    setStep(2);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setUpiPaymentConfirmed(false);
    if (method !== "postpaid") {
      setDueDate("");
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();

    if (step === 1) {
      handleNextStep();
      return;
    }

    if (paymentMethod === "postpaid" && !dueDate) {
      return toast({ title: "Validation Error", description: "Please select a due date for unpaid invoices", variant: "destructive" });
    }

    try {
      let finalStatus = "unpaid";
      if (paymentMethod === "cash") finalStatus = "paid";
      if (paymentMethod === "upi") finalStatus = upiPaymentConfirmed ? "paid" : "unpaid";
      if (paymentMethod === "postpaid") finalStatus = "unpaid";

      const invoiceData = {
        customer_id: customerId,
        date,
        // due_date column is NOT NULL in the database, so when there's no real
        // due date (paid via UPI/Cash), fall back to the invoice date itself.
        due_date: paymentMethod === "postpaid" ? dueDate : date,
        items: items.map(({ id, ...rest }) => rest),
        discount_type: discount > 0 ? "fixed" : null,
        discount_value: discount > 0 ? discount : null,
        payment_method: paymentMethod,
        status: finalStatus
      };

      await createInvoice(invoiceData);
      toast({ title: "Success", description: "Invoice created successfully" });
      router.push('/invoices');
    } catch (error) {
      toast({ title: "Error", description: "Failed to create invoice", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-5xl mx-auto">

      {/* Progress Tracker */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className={`flex items-center gap-3 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</span>
          <span className="text-lg font-semibold">Invoice Details</span>
        </div>
        <div className="flex-1 h-px bg-border mx-6"></div>
        <div className={`flex items-center gap-3 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
          <span className="text-lg font-semibold">Payment Option</span>
        </div>
      </div>

      {/* STEP 1: INVOICE DETAILS */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-32">Price</TableHead>
                  <TableHead className="w-24">GST %</TableHead>
                  <TableHead className="w-32">Amount</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select value={item.product_id || ""} onValueChange={(v) => updateItem(item.id, "product_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Custom Item" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Custom Item</SelectItem>
                          {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="Description" required /></TableCell>
                    <TableCell><Input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", Number(e.target.value))} required /></TableCell>
                    <TableCell><Input type="number" min="0" value={item.unit_price} onChange={e => updateItem(item.id, "unit_price", Number(e.target.value))} required /></TableCell>
                    <TableCell><Input type="number" min="0" max="100" value={item.gst_rate} onChange={e => updateItem(item.id, "gst_rate", Number(e.target.value))} required /></TableCell>
                    <TableCell>{formatCurrency(item.quantity * item.unit_price)}</TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 bg-muted/30 border-t">
              <Button type="button" variant="outline" onClick={addItem}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>GST:</span> <span>{formatCurrency(gstTotal)}</span></div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <Input type="number" className="w-32 text-right" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t"><span>Total:</span> <span>{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="button" onClick={handleNextStep}>Proceed to Payment</Button>
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT OPTIONS */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in duration-300">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange("upi")}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === 'upi' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
            >
              <QrCode className="w-10 h-10 mb-3" />
              <span className="font-semibold text-lg">UPI Dynamic</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentMethodChange("cash")}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === 'cash' ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-border text-muted-foreground hover:border-green-500/50'}`}
            >
              <Banknote className="w-10 h-10 mb-3" />
              <span className="font-semibold text-lg">Cash (Paid)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentMethodChange("postpaid")}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === 'postpaid' ? 'border-orange-500 bg-orange-500/10 text-orange-600' : 'border-border text-muted-foreground hover:border-orange-500/50'}`}
            >
              <Clock className="w-10 h-10 mb-3" />
              <span className="font-semibold text-lg">Postpaid (Unpaid)</span>
            </button>
          </div>

          {/* UPI: shows QR via PaymentQR component, does NOT auto mark as paid */}
          {paymentMethod === 'upi' && (
            <div className="p-6 rounded-2xl bg-muted/50 border flex flex-col items-center justify-center gap-4">
              <PaymentQR amount={grandTotal} invoiceNumber="DRAFT" />

              {!upiPaymentConfirmed ? (
                <div className="w-full pt-4 border-t flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Invoice will stay <strong className="text-orange-600">Unpaid</strong> until you confirm the payment has been received.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setUpiPaymentConfirmed(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Payment Received
                  </Button>
                </div>
              ) : (
                <div className="w-full pt-4 border-t flex items-center justify-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Payment confirmed — invoice will be marked as Paid
                </div>
              )}
            </div>
          )}

          {/* Postpaid: due date required here */}
          {paymentMethod === 'postpaid' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3 text-orange-700">
                <Info className="w-5 h-5 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">
                  This invoice will be marked as <strong className="font-bold underline">Unpaid</strong> and added to your Receivables aging ledger. You can log the payment later.
                </p>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label>Due Date</Label>
                <Input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 text-green-700">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">
                Funds assumed received in hand. Invoice will be securely marked as <strong className="font-bold">Paid</strong> in your ledger.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t mt-8">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back to Details
            </Button>
            <Button type="submit" size="lg" className="text-md">
              {paymentMethod === 'postpaid'
                ? 'Finalize Unpaid Invoice'
                : paymentMethod === 'upi'
                  ? (upiPaymentConfirmed ? 'Complete & Mark as Paid' : 'Save as Unpaid')
                  : 'Complete & Mark as Paid'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}