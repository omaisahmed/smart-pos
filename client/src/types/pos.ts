import { Product, Customer, Transaction, TransactionItem } from "@shared/schema";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface DashboardMetrics {
  todaySales: number;
  totalTransactions: number;
  lowStockItems: number;
  activeCustomers: number;
}

export interface TransactionWithDetails extends Transaction {
  items: (TransactionItem & { product: Product })[];
  customer?: Customer;
}

export interface ReceiptData {
  transaction: TransactionWithDetails;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  gstNumber?: string;
  cashierName: string;
}
