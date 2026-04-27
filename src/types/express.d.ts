import { JwtPayload } from "jsonwebtoken";

interface JwtUserPayload {
    address: string,
    role: string
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtUserPayload
        }
    }
}