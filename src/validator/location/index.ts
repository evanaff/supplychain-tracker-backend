import * as schema from './schema';
import InvariantError from '../../common/exceptions/InvariantError';

const LocationValidator = {
    validateLocationPayload: (payload: unknown) => {
        const validationResult = schema.LocationPayloadSchema.safeParse(payload);
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0].path + ', ' + validationResult.error.issues[0].message;
            throw new InvariantError(errorMessage);
        }
    }
}

export default LocationValidator;