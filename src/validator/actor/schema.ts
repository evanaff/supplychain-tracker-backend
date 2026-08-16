import { z } from "zod";

const nonAdminRoles = ['GROWER', 'DISTRIBUTOR', 'RETAILER'] as const;

export const CreateActorPayloadSchema = z.object({
    blockchainAddress: z
        .string()
        .min(1, 'Blockchain address is required')
        .regex(/^0x[0-9a-fA-F]{40}$/, 'Must be a valid Ethereum address (0x followed by 40 hex chars)'),
    locationGln: z
        .string()
        .min(1, 'Location GLN is required'),
    name: z.string().min(1, 'Name is required').max(100),
    role: z.enum(nonAdminRoles, { error: 'Role is required' }),
});

export const EditActorPayloadSchema = z.object({
    name: z.string(),
    role: z.enum(["GROWER", "DISTRIBUTOR", "RETAILER"]),
});