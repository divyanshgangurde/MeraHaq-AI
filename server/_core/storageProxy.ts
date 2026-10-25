import type { Express, Request, Response } from "express";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { resolveStoragePath } from "../storage";

// Serves objects written by server/storage.ts from local disk.
// /storage/* is the current prefix; /manus-storage/* is kept so URLs stored
// by older (Manus-hosted) ingestions resolve to the same local objects when
// they exist.
const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function serveStorageObject(req: Request, res: Response) {
  const key = (req.params as Record<string, string>)[0];
  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }

  try {
    const full = resolveStoragePath(key);
    const info = await stat(full).catch(() => null);
    if (!info || !info.isFile()) {
      res.status(404).send("Storage object not found");
      return;
    }
    const contentType =
      CONTENT_TYPES[path.extname(full).toLowerCase()] ??
      "application/octet-stream";
    res.set("Content-Type", contentType);
    res.set("Content-Length", String(info.size));
    res.set("Cache-Control", "no-store");
    createReadStream(full).pipe(res);
  } catch (err) {
    console.error("[Storage] serve failed:", err);
    res.status(500).send("Storage error");
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/storage/*", serveStorageObject);
  app.get("/manus-storage/*", serveStorageObject);
}
