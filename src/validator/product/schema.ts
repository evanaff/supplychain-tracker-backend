import { z } from "zod";

export const CreateProductPayloadSchema = z.object({
    gtin: z
        .string()
        .min(1, 'GTIN is required')
        .length(13, 'GTIN must be exactly 13 characters')
        .regex(/^\d+$/, 'GTIN must contain only numbers'),
    varietyName: z.string().min(1, 'Variety name is required'),
    unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
    image: z.custom<FileList>(
        (val) => typeof window !== 'undefined' && val instanceof FileList && val.length > 0,
        'Product image is required'
    ),
});