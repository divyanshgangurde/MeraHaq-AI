// Local-disk storage helpers (de-Manus replacement for the Forge S3 flow).
// Files are stored under STORAGE_DIR (default: <project>/data/storage) and
// served by the /storage/* route registered in server/_core/storageProxy.ts.
// The public interface (storagePut / storageGet / storageGetSignedUrl) is
// unchanged so callers such as dhruv ingestion needed no changes.

import { promises as fs } from "node:fs";
import path from "node:path";
import { ENV } from "./_core/env";

export function getStorageRoot(): string {
  return ENV.storageDir && ENV.storageDir.trim().length > 0
    ? path.resolve(ENV.storageDir)
    : path.resolve(process.cwd(), "data", "storage");
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// Resolve a storage key to an absolute file path, refusing keys that escape
// the storage root.
export function resolveStoragePath(relKey: string): string {
  const root = getStorageRoot();
  const full = path.resolve(root, normalizeKey(relKey));
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error(`Invalid storage key: ${relKey}`);
  }
  return full;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  // Kept for interface compatibility; content type is inferred from the file
  // extension when the object is served.
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const full = resolveStoragePath(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const buffer =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await fs.writeFile(full, buffer);
  return { key, url: `/storage/${key}` };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  // Local files need no signing; the /storage/* route serves them directly.
  const key = normalizeKey(relKey);
  return `/storage/${key}`;
}
