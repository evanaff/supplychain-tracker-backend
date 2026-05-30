import { z } from "zod";

export const CreateTraceProductPayloadSchema = z.object({
	gtin: z.string(),
	gln: z.string(),
	quantity: z.number().positive()
});

export const CreateGeneralEventPayloadSchema = z.object({
	traceProductId: z.string(),
	sourceGln: z.string()
});

export const CreateShippingEventPayloadSchema = z.object({
	traceProductId: z.string(),
	sourceGln: z.string(),
	destinationGln: z.string()
});

export const SubmitTraceEventPayloadSchema = z.object({
	signature: z.string()
});