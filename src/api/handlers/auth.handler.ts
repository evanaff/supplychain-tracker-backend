import { type Request, type Response, type NextFunction } from "express";

import AuthService from "../../services/postgres/AuthdbService";
import AuthValidator from "../../validator/auth";
import InvariantError from "../../common/exceptions/InvariantError";

const authService = new AuthService();

export const getGenerateNonceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let address = req.query.address?.toString();
        if (!address) {
            throw new InvariantError("Address is required");
        }

        const nonce = await authService.generateNonce(address);
        
        res.json({
            status: "success",
            data: {
                nonce
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postVerifySignatureHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        AuthValidator.validateVerifySignaturePayload(payload);
        const { message, signature } = payload;

        const token = await authService.verifyMessage(message, signature);

        res.json({
            status: "success",
            data: {
                token
            }
        });
    } catch (error) {
        next(error)
    }
}