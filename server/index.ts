import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // In development, include stack for easier debugging in the browser
    if (app.get('env') === 'development') {
      res.status(status).json({ message, stack: err.stack });
    } else {
      res.status(status).json({ message });
    }
    // still log the error to the console
    console.error(err);
    // don't rethrow here to avoid crashing the process in dev when handling errors
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // create built-in admin user if missing
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
    const existing = await storage.getUserByEmail(ADMIN_EMAIL);
    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await storage.upsertUser({
        id: crypto.randomUUID(),
        email: ADMIN_EMAIL,
        password: hash,
        firstName: 'Admin',
        lastName: '',
        role: 'admin',
      });
      log(`created built-in admin user ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    // don't crash startup for admin creation failures, just log
    console.error('Failed to ensure admin user:', err);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // bind to IPv6 unspecified address to accept both IPv6 and IPv4 connections
  server.listen({
    port,
    host: "::",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
