import { z } from "zod";

export const CreateTraceProductPayloadSchema = z.object({
	gtin: z.string(),
	quantity: z.number().positive()
});