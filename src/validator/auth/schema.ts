import { z } from "zod";

export const VerifySignaturePayloadSchema = z.object({
    message: z.string(),
    signature: z.string()
});

export const RefreshTokenPayloadSchema = z.object({
    refreshToken: z.string()
});