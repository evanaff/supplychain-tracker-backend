import { z } from "zod";

export const InsertTraceProductPayloadSchema = z.object({
  signature: z.string()
});