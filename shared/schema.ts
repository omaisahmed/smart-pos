import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  uuid
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("cashier"), // cashier, manager, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 100 }).unique().notNull(),
  barcode: varchar("barcode", { length: 100 }).unique(),
  category: varchar("category", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").default(5),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  creditBalance: decimal("credit_balance", { precision: 10, scale: 2 }).default("0"),
  totalPurchases: decimal("total_purchases", { precision: 10, scale: 2 }).default("0"),
  lastVisit: timestamp("last_visit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionNumber: varchar("transaction_number", { length: 50 }).unique().notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // cash, card, jazzcash, easypaisa
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("completed"),
  synced: boolean("synced").default(false), // for offline sync
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction items table
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory movements table
export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").references(() => products.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // in, out, adjustment
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: varchar("reason", { length: 100 }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  inventoryMovements: many(inventoryMovements),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
}));

export const productsRelations = relations(products, ({ many }) => ({
  transactionItems: many(transactionItems),
  inventoryMovements: many(inventoryMovements),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [inventoryMovements.userId],
    references: [users.id],
  }),
}));

// Insert schemas with proper type coercion
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.coerce.number().positive(),
  cost: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0).optional(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  creditBalance: z.coerce.number().min(0).optional(),
});

const baseTransactionSchema = createInsertSchema(transactions)
  .pick({
    transactionNumber: true,
    customerId: true,
    subtotal: true,
    tax: true,
    total: true,
    paymentMethod: true,
    paymentStatus: true,
    synced: true,
  });

export const insertTransactionSchema = z.preprocess(
  (data: any) => {
    if (data && typeof data === 'object') {
      // Remove id if present (shouldn't be in insert)
      const { id, ...rest } = data;
      // Convert numeric fields to strings
      return {
        ...rest,
        subtotal: typeof rest.subtotal === 'number' ? String(rest.subtotal) : rest.subtotal,
        tax: typeof rest.tax === 'number' ? String(rest.tax) : rest.tax,
        total: typeof rest.total === 'number' ? String(rest.total) : rest.total,
        customerId: rest.customerId === '' ? null : rest.customerId,
      };
    }
    return data;
  },
  baseTransactionSchema.extend({
    customerId: z.union([
      z.string().uuid(),
      z.literal(''),
      z.null(),
    ]).transform((val) => val === '' ? null : val).optional(),
    subtotal: z.string(),
    tax: z.string(),
    total: z.string(),
  })
);

const baseTransactionItemSchema = createInsertSchema(transactionItems)
  .omit({
    id: true,
    transactionId: true,
    createdAt: true,
  });

export const insertTransactionItemSchema = z.preprocess(
  (data: any) => {
    if (data && typeof data === 'object') {
      // Remove id and transactionId if present (shouldn't be in insert)
      const { id, transactionId, ...rest } = data;
      // Convert numeric fields to strings
      return {
        ...rest,
        unitPrice: typeof rest.unitPrice === 'number' ? String(rest.unitPrice) : rest.unitPrice,
        totalPrice: typeof rest.totalPrice === 'number' ? String(rest.totalPrice) : rest.totalPrice,
      };
    }
    return data;
  },
  baseTransactionItemSchema.extend({
    unitPrice: z.string(),
    totalPrice: z.string(),
  })
);

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
