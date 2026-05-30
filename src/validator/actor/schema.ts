import { z } from "zod";

export const CreateActorPayloadSchema = z.object({
    blockchainAddress: z.string(),
    name: z.string(),
    role: z.enum(["GROWER", "DISTRIBUTOR", "RETAILER"]),
});

export const EditActorPayloadSchema = z.object({
    name: z.string(),
    role: z.enum(["GROWER", "DISTRIBUTOR", "RETAILER"]),
});