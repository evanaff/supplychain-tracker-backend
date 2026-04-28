import { generateNonce } from "siwe";
import { isAddress } from "ethers";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";

import { db } from "../../lib/db";
import { actors, nonces } from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import { eq } from "drizzle-orm";
import NotFoundError from "../../common/exceptions/NotFoundError";
import config from "../../common/config";

class AuthdbService {
    async generateNonce(address: string) {
        if (!isAddress(address)) {
            throw new InvariantError("Invalid ethereum address")
        }
        const lowerCaseAddress = address.toLowerCase();
        
        const nonce = generateNonce();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.delete(nonces).where(eq(nonces.address, lowerCaseAddress));
        const result = await db.insert(nonces).values({
            address: lowerCaseAddress,
            nonce: nonce,
            expiresAt: expiresAt
        }).returning();

        return result[0].nonce;
    }

    async verifyMessage(
        message: string,
        signature: string,
    ){
        const siwe = new SiweMessage(message);
        const siweAddress = siwe.address.toLowerCase();
        const nonce = await this.getNonceByAddress(siweAddress);
        
        const result = await siwe.verify({
            signature: signature,
            nonce: nonce,
            domain: config.app.domainName
        });

        if (!result.success) {
            throw new InvariantError("Invalid signature")
        }

        await db.delete(nonces).where(eq(nonces.address, siweAddress));

        const record = await db.query.actors.findFirst({
            where: eq(actors.blockchainAddress, siweAddress)
        });

        if (!record) {
            throw new NotFoundError("User not found");
        }

        const jwtSecret = config.jwt.secret;
        if (!jwtSecret) {
            throw new Error("Jwt secret is empty")
        }
        const token = jwt.sign(
            {
                address: siweAddress,
                role: record.role
            },
            jwtSecret,
            {
                expiresIn: "1h"
            }
        )

        return token;
    }
    
    async getNonceByAddress(address: string) {
        const record = await db.query.nonces.findFirst({
            where: eq(nonces.address, address)
        });
    
        if (!record) {
            throw new NotFoundError("Nonce record not found");
        }

        if (record.expiresAt < new Date()) {
            await db.delete(nonces).where(eq(nonces.address, address));
            throw new InvariantError("Nonce expired")
        }

        return record.nonce;
    }
}

export default AuthdbService;