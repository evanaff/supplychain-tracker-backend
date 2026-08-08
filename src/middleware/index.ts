import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

import AuthenticationError from "../common/exceptions/AuthenticationError";
import AuthorizationError from "../common/exceptions/AuthorizationError";
import { JwtUserPayload } from "../types/express";
import { Role } from "../types/types";
import config from "../common/config";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            throw new AuthenticationError("No token provided");
        }

        const token = authHeader.split(' ')[1];
        
        if (!token || token.split('.').length !== 3) {
            throw new AuthenticationError("Invalid token")
        }

        const jwtSecret = config.jwt.secret;
    
        if (!jwtSecret) {
            throw new Error("Jwt secret is empty");
        }
        
        const decoded = jwt.verify(token, jwtSecret) as JwtUserPayload;
    
        req.user = decoded;
    
        next();
    } catch (error: any) {
        if (error.name == "TokenExpiredError") {
            return next(new AuthenticationError("Token expired"));
        }
        next(error);
    }
}

export const authorizeUser = (authorizedRole: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user) {
                throw new AuthorizationError("No user data provided");
            }

            if (!authorizedRole.includes(user.role)) {
                throw new AuthorizationError("Access denied");
            }

            next()
        } catch (error) {
            next(error);
        }
    }
}