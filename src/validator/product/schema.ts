import { z } from "zod";

export const CreateProductPayloadSchema = z.object({
	gtin: z.string().length(13),
	varietyName: z.string(),
	unitOfMeasure: z.string()
});