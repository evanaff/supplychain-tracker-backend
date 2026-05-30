import * as schema from "./schema";
import InvariantError from "../../common/exceptions/InvariantError";

const TraceValidator = {    
    validateCreateTraceProductPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.CreateTraceProductPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
    
    validateCreateGeneralEventPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.CreateGeneralEventPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
    
    validateCreateShippingEventPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.CreateShippingEventPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },

    validateSubmitTraceEventPayloadSchema: async (payload: unknown) => {
        const validationResult = schema.SubmitTraceEventPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
}

export default TraceValidator;