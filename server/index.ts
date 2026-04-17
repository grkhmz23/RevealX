import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { applySecurityMiddleware, corsOptions } from "./middleware/security";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { startBaseIndexer } from "./workers/baseIndexer";

const app = express();

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Apply CORS
app.use(cors(corsOptions));

// Security middleware (headers, sanitization, timeout)
applySecurityMiddleware(app);

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && process.env.NODE_ENV === "development") {
        const responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length < 200) {
          logLine += ` :: ${responseStr}`;
        }
      }

      if (logLine.length > 100) {
        logLine = logLine.slice(0, 99) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoint (before routes)
app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Start server
(async () => {
  const server = await registerRoutes(app);

  // Setup vite in development, static files in production
  // MUST be before error handlers so it can serve index.html
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler - must be after routes and static files
  app.use(errorHandler);
  
  // 404 handler - must be last
  app.use(notFoundHandler);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running on port ${port} (${process.env.NODE_ENV || "development"})`);
    if (process.env.ENABLE_INDEXER === "true") {
      startBaseIndexer();
    } else {
      log("ENABLE_INDEXER is not 'true'; skipping Base indexer startup.");
    }
  });
})();
