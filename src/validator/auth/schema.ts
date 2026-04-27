import { z } from "zod";

export const VerifySignaturePayloadSchema = z.object({
  message: z.string().min(1),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]{130}$/, "Invalid Ethereum signature"),
});