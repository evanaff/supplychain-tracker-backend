import { z } from "zod";

export const CreateTraceEventPayloadSchema = z.object({
	traceProductId: z.string(),
	supplyChainActivity: z.enum(["HARVESTING", "SHIPPING", "RECEIVING", "SELLING"]),
	destinationLocationGln: z.string()
});

export const SaveTxHashPayloadSchema = z.object({
	txHash: z.string()
});