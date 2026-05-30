import { JwtPayload } from "jsonwebtoken";
import { Role } from "../common/dto";

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