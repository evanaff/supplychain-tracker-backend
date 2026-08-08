import { type Request, type Response, type NextFunction } from "express";

import AuthService from "../../services/database/AuthService";
import AuthValidator from "../../validator/auth";
import { SiweMessage } from "siwe";

const authService = new AuthService();

export const postGenerateMessageHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;

        const { domain, address, uri, version, chainId } = payload;

        const nonce = await authService.generateNonce(address);

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
        
        const { accessToken, refreshToken, actor } = await authService.verifyMessage(message, signature);

        res.json({
            status: "success",
            data: {
                accessToken,
                refreshToken,
                actor
            }
        });
    } catch (error) {
        next(error)
    }
}

export const postRefreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        AuthValidator.validateRefreshTokenSchema(payload);
        const { refreshToken } = payload;

        const { accessToken, newRefreshToken, actor } = await authService.refreshSession(refreshToken);

        res.json({
            status: "success",
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                actor
            }
        });
    } catch (error) {
        next(error);
    }
}

export const deleteRefreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        AuthValidator.validateRefreshTokenSchema(payload);
        const { refreshToken } = payload;

        await authService.deleteRefreshToken(refreshToken);

        res.json({
            status: "success",
            message: "Refresh token deleted successfully"
        })
    } catch (error) {
        next(error);
    }
}