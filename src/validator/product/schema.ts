import { z } from "zod";

export const GenerateProductPayloadSchema = z.object({
  gtin: z.string().length(13)
});

export const InsertProductPayloadSchema = z.object({
  eventId: z.number(),
  signature: z.string()
});

export const TraceProductPayloadSchema = z.object({
  productId: z.string()
});