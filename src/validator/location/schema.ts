import { z } from 'zod';

export const LocationPayloadSchema = z.object({
    name: z.string(),
    province: z.string(),
    city: z.string(),
    address: z.string(),
});