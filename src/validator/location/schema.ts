import { z } from 'zod';

const allowedRoles = ['GROWER', 'DISTRIBUTOR', 'RETAILER'] as const;

export const LocationPayloadSchema = z.object({
    gln: z
        .string()
        .length(13, 'GLN must be exactly 13 characters')
        .regex(/^\d{13}$/, 'GLN must contain only digits'),
    name: z.string().min(1, 'Name is required').max(100),
    province: z.string().min(1, 'Province is required').max(100),
    city: z.string().min(1, 'City is required').max(100),
    address: z.string().min(1, 'Address is required').max(200),
    allowedRole: z.enum(allowedRoles, { error: 'Allowed role is required' }),
});