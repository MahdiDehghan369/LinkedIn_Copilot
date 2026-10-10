import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * @file Local-disk storage for post images.
 *
 * This is a deliberate MVP choice consistent with the rest of this
 * app's pragmatic-tradeoff pattern (see FerretDB in dev, the no-DLQ
 * RabbitMQ setup, etc.): it works correctly as long as the HTTP server
 * and the worker process share the same filesystem, which is true for
 * a single-machine deployment. It does **not** work if the worker is
 * scaled onto separate machines from the API server — the image bytes
 * saved by the API process wouldn't exist on a different worker host.
 * A real multi-machine deployment should replace this module with one
 * backed by S3/GCS/Azure Blob (object storage reachable by every
 * process) — every caller of this module only depends on the four
 * exported functions below, so that swap doesn't touch any other file.
 */

const STORAGE_ROOT = path.resolve(process.cwd(), "storage", "uploads");

async function ensureStorageDir() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

/**
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {Promise<string>} the storage key to persist on the Post document
 */
export async function saveImage(buffer, originalName) {
  await ensureStorageDir();
  const ext = path.extname(originalName || "").slice(0, 10) || "";
  const key = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(STORAGE_ROOT, key), buffer);
  return key;
}

/**
 * @param {string} storageKey
 * @returns {Promise<Buffer>}
 */
export async function readImage(storageKey) {
  return fs.readFile(path.join(STORAGE_ROOT, storageKey));
}

/**
 * @param {string} storageKey
 * @returns {Promise<void>}
 */
export async function deleteImage(storageKey) {
  await fs.rm(path.join(STORAGE_ROOT, storageKey), { force: true });
}
