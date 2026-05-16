import { type Request, type Response, type NextFunction } from "express";

import AuthService from "../../services/database/AuthService";
import AuthValidator from "../../validator/auth";
import InvariantError from "../../common/exceptions/InvariantError";
import { SiweMessage } from "siwe";

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

export const postSiweMessageHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;

        const { domain, address, uri, version, chainId, nonce } = payload;

        const siweMessage = new SiweMessage({
            domain, 
            address,
            statement: "Sign in to SupplyChainTracker",
            uri,
            version,
            chainId,
            nonce,
            issuedAt: new Date().toISOString(),
        });

        const message = siweMessage.prepareMessage();

        res.json({
            status: "success",
            data: {
                message
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
        
        const { token, role } = await authService.verifyMessage(message, signature);

        res.json({
            status: "success",
            data: {
                token,
                role
            }
        });
    } catch (error) {
        next(error)
    }
}