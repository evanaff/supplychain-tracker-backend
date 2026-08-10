import { z } from "zod";

export const CreateGeneralEventPayloadSchema = z.object({
	traceProductId: z.string(),
});

export const CreateShippingEventPayloadSchema = z.object({
	traceProductId: z.string(),
	destinationLocationGln: z.string()
});