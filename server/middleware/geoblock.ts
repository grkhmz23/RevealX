/**
 * Geoblocking Middleware
 *
 * Blocks traffic from restricted countries based on the Cloudflare cf-ipcountry header.
 * If the header is missing (local dev), logs a warning and allows the request.
 */

import type { Request, Response, NextFunction } from "express";

const BLOCKED_COUNTRIES = new Set([
  "US", "UK", "FR", "DE", "NL", "AU", "SG",
  // OFAC-sanctioned additions commonly enforced
  "IR", "KP", "SY", "CU", "RU", "BY",
]);

export function geoblockMiddleware(req: Request, res: Response, next: NextFunction) {
  const country = req.headers["cf-ipcountry"] as string | undefined;

  if (!country) {
    console.warn(`[Geoblock] Missing cf-ipcountry header for ${req.ip} — allowing (local dev?)`);
    return next();
  }

  if (BLOCKED_COUNTRIES.has(country.toUpperCase())) {
    return res.status(403).json({
      error: "GEO_BLOCKED",
      message: "Access not available in your region.",
    });
  }

  next();
}
