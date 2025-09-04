import {
  users,
  products,
  customers,
  transactions,
  transactionItems,
  inventoryMovements,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
  type InventoryMovement,
  type InsertInventoryMovement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
  updateProductStock(id: string, quantity: number, type: 'in' | 'out' | 'adjustment', userId: string, reason?: string): Promise<void>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Transaction operations
  getTransactions(limit?: number): Promise<(Transaction & { items: (TransactionItem & { product: Product })[], customer?: Customer })[]>;
  getTransaction(id: string): Promise<(Transaction & { items: (TransactionItem & { product: Product })[], customer?: Customer }) | undefined>;
  createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  getUnsyncedTransactions(): Promise<Transaction[]>;
  markTransactionsSynced(transactionIds: string[]): Promise<void>;

  // Inventory operations
  getInventoryMovements(productId?: string): Promise<InventoryMovement[]>;

  // Reports
  getDashboardMetrics(date?: Date): Promise<{
    todaySales: number;
    totalTransactions: number;
    lowStockItems: number;
    activeCustomers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product;
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stock} <= ${products.minStock}`
        )
      );
  }

  async updateProductStock(id: string, quantity: number, type: 'in' | 'out' | 'adjustment', userId: string, reason?: string): Promise<void> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) throw new Error("Product not found");

    const previousStock = product.stock;
    let newStock: number;

    switch (type) {
      case 'in':
        newStock = previousStock + quantity;
        break;
      case 'out':
        newStock = previousStock - quantity;
        break;
      case 'adjustment':
        newStock = quantity;
        break;
    }

    await db.transaction(async (tx) => {
      await tx.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, id));
      await tx.insert(inventoryMovements).values({
        productId: id,
        type,
        quantity: type === 'adjustment' ? newStock - previousStock : quantity,
        previousStock,
        newStock,
        reason,
        userId,
      });
    });
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.lastVisit));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Transaction operations
  async getTransactions(limit = 50): Promise<(Transaction & { items: (TransactionItem & { product: Product })[], customer?: Customer })[]> {
    const transactionList = await db
      .select()
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    const result = [];
    for (const { transactions: transaction, customers: customer } of transactionList) {
      const items = await db
        .select()
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .where(eq(transactionItems.transactionId, transaction.id));

      result.push({
        ...transaction,
        customer: customer || undefined,
        items: items.map(({ transaction_items, products }) => ({
          ...transaction_items,
          product: products!,
        })),
      });
    }

    return result;
  }

  async getTransaction(id: string): Promise<(Transaction & { items: (TransactionItem & { product: Product })[], customer?: Customer }) | undefined> {
    const [transactionData] = await db
      .select()
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .where(eq(transactions.id, id));

    if (!transactionData) return undefined;

    const items = await db
      .select()
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .where(eq(transactionItems.transactionId, id));

    return {
      ...transactionData.transactions,
      customer: transactionData.customers || undefined,
      items: items.map(({ transaction_items, products }) => ({
        ...transaction_items,
        product: products!,
      })),
    };
  }

  async createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction> {
    const result = await db.transaction(async (tx) => {
      const [newTransaction] = await tx.insert(transactions).values(transaction).returning();
      
      // Insert transaction items
      const transactionItemsWithId = items.map(item => ({
        ...item,
        transactionId: newTransaction.id,
      }));
      await tx.insert(transactionItems).values(transactionItemsWithId);

      // Update product stock
      for (const item of items) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newStock = product.stock - item.quantity;
          await tx.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, item.productId));
          
          // Record inventory movement
          await tx.insert(inventoryMovements).values({
            productId: item.productId,
            type: 'out',
            quantity: item.quantity,
            previousStock: product.stock,
            newStock,
            reason: 'Sale transaction',
            userId: transaction.userId,
          });
        }
      }

      // Update customer last visit and total purchases
      if (transaction.customerId) {
        const [customer] = await tx.select().from(customers).where(eq(customers.id, transaction.customerId));
        if (customer) {
          await tx.update(customers).set({
            lastVisit: new Date(),
            totalPurchases: sql`${customers.totalPurchases} + ${transaction.total}`,
            updatedAt: new Date(),
          }).where(eq(customers.id, transaction.customerId));
        }
      }

      return newTransaction;
    });

    return result;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        )
      )
      .orderBy(desc(transactions.createdAt));
  }

  async getUnsyncedTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.synced, false));
  }

  async markTransactionsSynced(transactionIds: string[]): Promise<void> {
    await db.update(transactions).set({ synced: true }).where(sql`${transactions.id} = ANY(${transactionIds})`);
  }

  // Inventory operations
  async getInventoryMovements(productId?: string): Promise<InventoryMovement[]> {
    const query = db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt));
    
    if (productId) {
      return await query.where(eq(inventoryMovements.productId, productId));
    }
    
    return await query;
  }

  // Reports
  async getDashboardMetrics(date = new Date()): Promise<{
    todaySales: number;
    totalTransactions: number;
    lowStockItems: number;
    activeCustomers: number;
  }> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const [salesData] = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startOfDay),
          lte(transactions.createdAt, endOfDay)
        )
      );

    const lowStockProducts = await this.getLowStockProducts();
    
    const [customerData] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers);

    return {
      todaySales: Number(salesData?.totalSales || 0),
      totalTransactions: Number(salesData?.transactionCount || 0),
      lowStockItems: lowStockProducts.length,
      activeCustomers: Number(customerData?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
