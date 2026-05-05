import { z } from "zod";

export const InsertProductPayloadSchema = z.object({
  signature: z.string()
});