import InvariantError from "../../common/exceptions/InvariantError";
import * as schema from "./schema";

const ProductValidator = {
    validateGenerateProductPayload: (payload: unknown) => {
        const validationResult = schema.GenerateProductPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
    
    validateInsertProductSchema: async (payload: unknown) => {
        const validationResult = schema.InsertProductPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    }
}

export default ProductValidator;