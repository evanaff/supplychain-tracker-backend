import { z } from "zod";

export const CreateProductEventPayloadSchema = z.object({
	productLotId: z.string(),
	supplyChainActivity: z.enum(["HARVESTING", "SHIPPING", "RECEIVING", "SELLING"]),
	destinationLocationGln: z.string()
});

export const SaveTxHashPayloadSchema = z.object({
	txHash: z.string()
});