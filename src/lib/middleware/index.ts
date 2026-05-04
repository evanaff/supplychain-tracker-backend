import { type Request, type Response, type NextFunction } from "express";
import AuthenticationError from "../../common/exceptions/AuthenticationError";
import jwt from "jsonwebtoken";
import config from "../../common/config";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import { JwtUserPayload } from "../../types/express";

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

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("No user data provided");
        }

        if (user.role != "ADMIN") {
            throw new AuthorizationError("Admin access required")
        }

        next();
    } catch (error) {
        next(error);
    }
}

export const onlyGrower = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("No user data provided");
        }

        if (user.role !== "GROWER") {
            throw new AuthorizationError("Grower access required");
        }

        next();
    } catch (error) {
        next(error);
    }
}