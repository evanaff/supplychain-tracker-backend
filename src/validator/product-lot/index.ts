import * as schema from "./schema";
import InvariantError from "../../common/exceptions/InvariantError";

const ProductLotValidator = {    
    validateCreateProductLotPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.CreateProductLotPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
}

export default ProductLotValidator;