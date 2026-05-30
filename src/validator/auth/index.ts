import * as schema from "./schema";
import InvariantError from "../../common/exceptions/InvariantError";

const AuthValidator = {
    validateVerifySignaturePayload: async (payload: unknown) => {
        const validationResult = schema.VerifySignaturePayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },

    validateRefreshTokenSchema: async (payload: unknown) => {
        const validationResult = schema.RefreshTokenPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    }
}

export default AuthValidator;