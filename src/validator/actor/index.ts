import InvariantError from '../../common/exceptions/InvariantError';
import * as schema from './schema';

const ActorValidator = {
    validateActorPayload: (payload: unknown) => {
        const validationResult = schema.ActorPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    }
}

export default ActorValidator;