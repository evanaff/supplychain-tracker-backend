import { type Request, type Response, type NextFunction } from "express";

import AuthService from "../../services/AuthService";
import AuthValidator from "../../validator/auth";
import { SiweMessage } from "siwe";
import config from "../../common/config";
import InvariantError from "../../common/exceptions/InvariantError";

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

        res.cookie("sct_access_token", accessToken, {
            httpOnly: true,
            secure: config.app.isProduction,
            sameSite: config.app.isProduction ? "none" : "lax",
            path: "/api",
            maxAge: 60 * 60 * 1000
        });
        res.cookie("sct_refresh_token", refreshToken, {
            httpOnly: true,
            secure: config.app.isProduction,
            sameSite: config.app.isProduction ? "none" : "lax",
            path: "/api",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            status: "success",
            data: {
                actor
            },
        });
    } catch (error) {
        next(error)
    }
}

export const postRefreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies?.sct_refresh_token;
        if (!refreshToken) {
            return next(new InvariantError("Refresh token is missing"));
        }

        const { accessToken, newRefreshToken, actor } = await authService.refreshSession(refreshToken);

        res.cookie("sct_access_token", accessToken, {
            httpOnly: true,
            secure: config.app.isProduction,
            sameSite: config.app.isProduction ? "none" : "lax",
            path: "/api",
            maxAge: 60 * 60 * 1000
        });
        res.cookie("sct_refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: config.app.isProduction,
            sameSite: config.app.isProduction ? "none" : "lax",
            path: "/api",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            status: "success",
            data: {
                actor
            }
        });
    } catch (error) {
        next(error);
    }
}

export const deleteRefreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies?.sct_refresh_token;
        if (refreshToken) {
            await authService.deleteRefreshToken(refreshToken);
        }

        res.clearCookie("sct_access_token", {
            httpOnly: true,
            secure: config.app.isProduction,
            sameSite: config.app.isProduction ? "none" : "lax",
            path: "/api",
        });
        res.clearCookie("sct_refresh_token", {
            httpOnly: true,
            secure: config.app.isProduction,
            sameSite: config.app.isProduction ? "none" : "lax",
            path: "/api",
        });

        res.json({
            status: "success",
            message: "Session ended successfully"
        })
    } catch (error) {
        next(error);
    }
}