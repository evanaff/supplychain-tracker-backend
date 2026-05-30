import * as schema from './schema';
import InvariantError from '../../common/exceptions/InvariantError';

const ActorValidator = {
    validateCreateActorPayload: (payload: unknown) => {
        const validationResult = schema.CreateActorPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },

    validateEditActorPayload: (payload: unknown) => {
        const validationResult = schema.EditActorPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    },
}

export default ActorValidator;