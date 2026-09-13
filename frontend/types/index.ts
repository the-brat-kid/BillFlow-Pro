export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface BusinessProfile {
  id: string;
  business_name: string;
  business_type: string;
  address: string;
  gst_number: string;
  upi_id: string;
  phone?: string;
  logo_base64?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  business_profile: BusinessProfile;
}

export interface DashboardStats {
  total_revenue: number;
  total_invoices: number;
  total_customers: number;
  total_products: number;
  paid_invoices: number;
  unpaid_invoices: number;
  overdue_invoices: number;
}

export interface Transaction {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gst_number?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  gst_rate: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  product_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  date: string;
  due_date: string;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  gst_total: number;
  discount_type?: string | null;
  discount_value?: number | null;
  grand_total: number;
  payment_method?: string | null;
  notes?: string | null;
  terms?: string | null;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  receipt_url?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}
