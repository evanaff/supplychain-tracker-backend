import { z } from "zod";

export const CreateTraceProductPayloadSchema = z.object({
    gtin: z.string().min(1, 'Product (GTIN) is required'),
    quantity: z
        .number({ error: 'Quantity must be a number' })
        .positive('Quantity must be greater than 0')
        .int('Quantity must be a whole number'),
});