import { z } from 'zod';

export const LocationPayloadSchema = z.object({
    gln: z.string().length(13),
    name: z.string().min(1),
    province: z.string().min(1),
    city: z.string().min(1),
    address: z.string().min(1),
    allowedRole: z.enum(["GROWER", "DISTRIBUTOR", "RETAILER"])
});