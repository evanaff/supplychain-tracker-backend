import * as schema from "./schema";
import InvariantError from "../../common/exceptions/InvariantError";

const TraceEventValidator = {    
    validateCreateTraceEventPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.CreateTraceEventPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
    
    validateSaveTxHashPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.SaveTxHashPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },    
}

export default TraceEventValidator;