import InvariantError from "../../common/exceptions/InvariantError";
import * as schema from "./schema";

const ProductValidator = {    
    validateCreateProductSchema: async (payload: unknown) => {
        const validationResult = schema.CreateProductPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
}

export default ProductValidator;