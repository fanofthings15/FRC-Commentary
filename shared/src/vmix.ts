import { z } from "zod";

// What the backend reports about vMix after parsing its XML API. The string
// fields are optional because vMix omits them depending on its state (e.g. an
// input may have no title), and the backend passes through whatever it finds.

export const vmixInputSchema = z.object({
  number: z.string().optional(),
  key: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  state: z.string().optional(),
});
export type VmixInput = z.infer<typeof vmixInputSchema>;

export const vmixStatusSchema = z.object({
  active: z.string().optional(),
  preview: z.string().optional(),
  recording: z.boolean(),
  streaming: z.boolean(),
  external: z.boolean(),
  inputs: z.array(vmixInputSchema),
});
export type VmixStatus = z.infer<typeof vmixStatusSchema>;
