import { z } from "zod";

export const CreateActorPayloadSchema = z.object({
    blockchainAddress: z.string().min(1),
    locationGln: z.string().min(1),
    name: z.string().min(1),
    role: z.enum(["GROWER", "DISTRIBUTOR", "RETAILER"]),
});

export const EditActorPayloadSchema = z.object({
    name: z.string(),
    role: z.enum(["GROWER", "DISTRIBUTOR", "RETAILER"]),
});