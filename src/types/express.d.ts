import { JwtPayload } from "jsonwebtoken";
import { Role } from "./dataTransferObject";

interface JwtUserPayload {
    address: string,
    role: Role
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtUserPayload
        }
    }
}