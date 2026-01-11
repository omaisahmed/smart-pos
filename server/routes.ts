// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertProductSchema, insertCustomerSchema, insertTransactionSchema, insertTransactionItemSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session and Passport setup
  app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        // Allow a built-in admin fallback user
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

        if (!user) {
          if (email === ADMIN_EMAIL) {
            // compare plaintext password with ADMIN_PASSWORD
            const match = password === ADMIN_PASSWORD;
            if (!match) return done(null, false, { message: "Incorrect password." });
            const adminUser = { id: 'admin', email: ADMIN_EMAIL, firstName: 'Admin', lastName: '', role: 'admin' } as any;
            return done(null, adminUser);
          }
          return done(null, false, { message: "Incorrect email." });
        }

        const match = await bcrypt.compare(password, user.password || "");
        if (!match) return done(null, false, { message: "Incorrect password." });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      if (id === 'admin') {
        // return built-in admin user
        return done(null, { id: 'admin', email: process.env.ADMIN_EMAIL || 'admin@admin.com', firstName: 'Admin', lastName: '', role: 'admin' });
      }
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  function isAuthenticated(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  }

  // Auth routes
  app.get('/api/auth/user', (req: any, res: any) => {
    if (!req.user) return res.json(null);
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Logout route for session-based auth
  app.get('/api/logout', (req: any, res: any) => {
    try {
      // Passport provides a logout callback in newer versions
      req.logout(() => {
        // destroy the session on the server
        if (req.session) {
          req.session.destroy(() => {
            // redirect back to client root after logout
            res.redirect('/');
          });
        } else {
          res.redirect('/');
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
      // best-effort: clear session cookie and redirect
      res.clearCookie('connect.sid');
      res.redirect('/');
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req: any, res: any) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Update current user profile
  app.put('/api/auth/user', isAuthenticated, async (req: any, res: any) => {
    try {
      const { firstName, lastName, email } = req.body;
      const userId = req.user.id;
      const updated = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      } as any);
      const { password, ...userWithoutPassword } = updated as any;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.post("/api/register", async (req: any, res: any) => {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    try {
      // prevent registering an email that already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) return res.status(409).json({ message: "Email already registered" });
      const hash = await bcrypt.hash(password, 10);
      const user = await storage.upsertUser({
        id: crypto.randomUUID(),
        email,
        password: hash,
        firstName,
        lastName,
        role: role || "cashier",
      });
      const { password: pw, ...userWithoutPassword } = user as any;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/low-stock', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.post('/api/products/:id/stock', isAuthenticated, async (req: any, res) => {
    try {
      const { quantity, type, reason } = req.body;
      const userId = req.user.id;
      await storage.updateProductStock(req.params.id, quantity, type, userId, reason);
      res.status(200).json({ message: "Stock updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to update stock" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch {
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      res.json(customer);
    } catch {
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/transactions/:id', isAuthenticated, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) return res.status(404).json({ message: "Transaction not found" });
      res.json(transaction);
    } catch {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  const createTransactionSchema = z.object({
    transaction: insertTransactionSchema,
    items: z.array(insertTransactionItemSchema),
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { transaction: transactionData, items } = createTransactionSchema.parse(req.body);
      transactionData.userId = req.user.id;
      const transaction = await storage.createTransaction(transactionData, items);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Transaction creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Failed to create transaction", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get('/api/transactions/unsynced', isAuthenticated, async (_req, res) => {
    try {
      const transactions = await storage.getUnsyncedTransactions();
      res.json(transactions);
    } catch {
      res.status(500).json({ message: "Failed to fetch unsynced transactions" });
    }
  });

  app.post('/api/transactions/mark-synced', isAuthenticated, async (req, res) => {
    try {
      const { transactionIds } = req.body;
      await storage.markTransactionsSynced(transactionIds);
      res.status(200).json({ message: "Transactions marked as synced" });
    } catch {
      res.status(500).json({ message: "Failed to mark transactions as synced" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const metrics = await storage.getDashboardMetrics(date);
      res.json(metrics);
    } catch {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/reports/sales', isAuthenticated, async (req, res) => {
    try {
      const startDate = new Date(req.query.startDate as string);
      startDate.setHours(0, 0, 0, 0); // Start of day
      
      const endDate = new Date(req.query.endDate as string);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      const transactions = await storage.getTransactionsByDateRange(startDate, endDate);
      res.json(transactions);
    } catch {
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  // Inventory movement routes
  app.get('/api/inventory/movements', isAuthenticated, async (req, res) => {
    try {
      const productId = req.query.productId as string;
      const movements = await storage.getInventoryMovements(productId);
      res.json(movements);
    } catch {
      res.status(500).json({ message: "Failed to fetch inventory movements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
