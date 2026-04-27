import { z } from 'zod';

export const ActorPayloadSchema = z.object({
    blockchainAddress: z.string(),
    role: z.enum(['GROWER', 'DISTRIBUTOR', 'RETAILER']),
    actorName: z.string(),
    location: z.object({
        locationName: z.string(),
        address: z.string(),
    })
});