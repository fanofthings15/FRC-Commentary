import { z } from "zod";

// A producer -> commentator alert. The full message (with the server-stamped
// `sentAt`) is what gets broadcast over the WebSocket; the incoming variant is
// what a client sends in (the server adds `sentAt` itself). The backend uses
// `incomingAlertSchema` to validate messages off the socket instead of a
// hand-written type check.

export const alertMessageSchema = z.object({
  type: z.literal("alert"),
  text: z.string(),
  sentAt: z.number(),
});
export type AlertMessage = z.infer<typeof alertMessageSchema>;

export const incomingAlertSchema = alertMessageSchema.omit({ sentAt: true });
export type IncomingAlert = z.infer<typeof incomingAlertSchema>;
