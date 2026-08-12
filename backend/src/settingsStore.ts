import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "fs";
import path from "path";
import os from "os";

// Deliberately stored OUTSIDE the repo — in the user's home directory —
// so it never risks getting committed to git, and survives repo re-clones,
// `bun run build:exe` runs, and app updates.
const DATA_DIR = path.join(os.homedir(), ".frc-commentary");
const KEY_PATH = path.join(DATA_DIR, "key.bin");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.enc");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function getOrCreateKey(): Buffer {
  ensureDataDir();
  if (existsSync(KEY_PATH)) {
    return readFileSync(KEY_PATH);
  }
  const key = randomBytes(32);
  writeFileSync(KEY_PATH, key, { mode: 0o600 });
  try {
    chmodSync(KEY_PATH, 0o600);
  } catch {
    // best-effort on platforms where chmod semantics differ (e.g. Windows)
  }
  return key;
}

export function saveSettings(data: unknown): void {
  ensureDataDir();
  const key = getOrCreateKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf-8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]);
  writeFileSync(SETTINGS_PATH, payload, { mode: 0o600 });
}

export function loadSettings(): unknown | null {
  if (!existsSync(SETTINGS_PATH)) return null;
  try {
    const key = getOrCreateKey();
    const payload = readFileSync(SETTINGS_PATH);
    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf-8"));
  } catch (err) {
    console.error("Failed to load settings (corrupt file or key mismatch):", err);
    return null;
  }
}
