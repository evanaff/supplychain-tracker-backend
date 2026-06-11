import { z } from "zod";

export const CreateTraceProductPayloadSchema = z.object({
	gtin: z.string(),
	quantity: z.number().positive()
});

export const CreateGeneralEventPayloadSchema = z.object({
	traceProductId: z.string(),
});

export const CreateShippingEventPayloadSchema = z.object({
	traceProductId: z.string(),
	destinationLocationGln: z.string()
});

export const SubmitTraceEventPayloadSchema = z.object({
	signature: z.string()
});