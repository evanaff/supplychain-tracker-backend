import { z } from "zod";

export const CreateProductPayloadSchema = z.object({
  name: z.string()
});