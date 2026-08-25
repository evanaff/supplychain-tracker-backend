import { generateNonce } from "siwe";
import { isAddress } from "ethers";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import InvariantError from "../common/exceptions/InvariantError";
import NotFoundError from "../common/exceptions/NotFoundError";
import AuthenticationError from "../common/exceptions/AuthenticationError";
import config from "../common/config";

class AuthService {
    async generateNonce(address: string) {
        if (!isAddress(address)) {
            throw new InvariantError("Invalid ethereum address")
        }
        
        const lowerCaseAddress = address.toLowerCase();
        const nonce = generateNonce();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await db.delete(schema.nonces).where(eq(schema.nonces.address, lowerCaseAddress));
        const result = await db.insert(schema.nonces).values({
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
        
        try {
            await siwe.verify({
                signature: signature,
                nonce: nonce,
                domain: config.app.domainName
            });
        } catch (error) {
            throw new InvariantError("Failed to verify message");
        }

        await db.delete(schema.nonces).where(eq(schema.nonces.address, siweAddress));

        const record = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, siweAddress)
        });

        if (!record) {
            throw new NotFoundError("User not found");
        }

        const jwtSecret = config.jwt.secret;
        if (!jwtSecret) {
            throw new Error("Jwt secret is empty")
        }
        const accessToken = jwt.sign(
            {
                address: siweAddress,
                name: record.name,
                role: record.role
            },
            jwtSecret,
            {
                expiresIn: "1h"
            }
        );

        const refreshToken = crypto.randomBytes(64).toString("hex");
        const refreshTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

        await db.insert(schema.refreshTokens).values({
            address: record.blockchainAddress,
            token: refreshToken,
            expiresAt: refreshTokenExpiresAt
        });

        return { 
            accessToken, 
            refreshToken, 
            actor: {
                address: siweAddress, 
                name: record.name, 
                role: record.role 
            }
        }
    }
    
    async getNonceByAddress(address: string) {
        const lowerCaseAddress = address.toLowerCase();
        const record = await db.query.nonces.findFirst({
            where: eq(schema.nonces.address, lowerCaseAddress)
        });
    
        if (!record) {
            throw new NotFoundError("Nonce record not found");
        }

        if (record.expiresAt < new Date()) {
            await db.delete(schema.nonces).where(eq(schema.nonces.address, address));
            throw new InvariantError("Nonce expired")
        }

        return record.nonce;
    }

    async refreshSession(refreshToken: string) {   
        const refreshTokenRecord = await db.query.refreshTokens.findFirst({
            where: eq(schema.refreshTokens.token, refreshToken)
        });
        if (!refreshTokenRecord || refreshTokenRecord.token !== refreshToken) {
            throw new AuthenticationError("Invalid refresh token");
        }

        if (refreshTokenRecord.expiresAt < new Date()) {
            await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));

            throw new AuthenticationError("Refresh token expired");
        }

        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, refreshTokenRecord.address)
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found")
        }

        const jwtSecret = config.jwt.secret;
        if (!jwtSecret) {
            throw new Error("Jwt secret is empty")
        }

        const accessToken = jwt.sign(
            {
                address: actorRecord.blockchainAddress,
                name: actorRecord.name,
                role: actorRecord.role
            },
            jwtSecret,
            {
                expiresIn: "1h"
            }
        );

        await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));
        
        const newRefreshToken = crypto.randomBytes(64).toString("hex");
        const newRefreshTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

        await db.insert(schema.refreshTokens).values({
            address: actorRecord.blockchainAddress,
            token: newRefreshToken,
            expiresAt: newRefreshTokenExpiresAt
        });

        return { 
            accessToken,
            newRefreshToken,
            actor: {
                address: actorRecord.blockchainAddress, 
                name: actorRecord.name, 
                role: actorRecord.role 
            }
        }
    }

    async deleteRefreshToken(refreshToken: string){
        await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));
    }
}

export default AuthService;