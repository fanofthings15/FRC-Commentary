import type { Request } from "express";

// Reads a single string query param, tolerating Express's `string | string[] |
// ParsedQs | ...` query typing without an `any` cast at each call site.
export function queryString(req: Request, name: string): string | undefined {
  const v = req.query[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

// Narrows an unknown thrown value (TS types `catch` bindings as `unknown`) to a
// message string, so route handlers never need `catch (err: any)`.
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
