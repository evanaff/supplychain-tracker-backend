import { and, count, eq, ilike, ne } from "drizzle-orm";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import InvariantError from "../common/exceptions/InvariantError";
import NotFoundError from "../common/exceptions/NotFoundError";
import { ListActorsQueryDTO, CreateActorDTO, EditActorDTO } from "../types/dataTransferObject";
import { isAddress } from "ethers";
import { contract } from "../lib/contract";

class ActorService {
    async registerActorToDatabase(payload: CreateActorDTO) {
        if (!isAddress(payload.blockchainAddress)) {
            throw new InvariantError("Invalid blockchain address")
        }

        const lowerCaseBlockchainAddress = payload.blockchainAddress.toLowerCase();

        const exist = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, lowerCaseBlockchainAddress)
        });
        if (exist) {
            throw new InvariantError("Blockchain address is already registered");
        }
        
        const locationRecord = await db.query.locations.findFirst({
            where: eq(schema.locations.gln, payload.locationGln)
        });
        if (!locationRecord) {
            throw new NotFoundError("Location not found");
        }

        if (locationRecord.allowedRole !== payload.role) {
            throw new InvariantError("Invalid role for this location");
        }

        const result = await db.insert(schema.actors).values({
            blockchainAddress: lowerCaseBlockchainAddress,
            locationGln: payload.locationGln,
            name: payload.name,
            role: payload.role
        }).returning();
        if (!result) {
            throw new InvariantError("Failed to add actor");
        }

        return result[0];
    }

    async registerActorToBlockchain(blockchainAddress: string) {
        const lowerCaseBlockchainAddress = blockchainAddress.toLowerCase();

        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, lowerCaseBlockchainAddress)
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found")
        }

        let tx
        try {
            tx = await contract.addActor(blockchainAddress);
            tx.wait();
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }

        await db.update(schema.actors).set({
            txHash: tx.hash
        }).where(eq(schema.actors.blockchainAddress, lowerCaseBlockchainAddress));

        return tx.hash;
    }

    async listActors(query: ListActorsQueryDTO) {
        const {
            page = 1,
            limit = 10,
            search,
            filter
        } = query;

        const offset = (page - 1) * limit;

        const conditions = [];

        if (filter) {
            conditions.push(eq(schema.actors.role, filter));
        }

        if (search) {
            conditions.push(
                ilike(schema.actors.name, `%${search}%`)
            );
        }

        conditions.push(ne(schema.actors.role, "ADMIN"));

        const whereClause = conditions.length > 0
                                ? and(...conditions)
                                : undefined

        const actorRecords = await db.query.actors.findMany({
            where: whereClause,
            limit,
            offset,
            with: {
                location: true
            }
        });

        const totalItemCount = await db.select({
            total: count()
        }).from(schema.actors).where(whereClause);
        const totalItems = totalItemCount[0].total;

        const totalPages = Math.ceil(totalItems/limit);

        return {
            actors: actorRecords,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        }
    }

    async getActorByBlockchainAddress(address: string) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, address)
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found");
        }

        return actorRecord;
    }

    async countGrower() {
        const growerCount = await db.select({
            total: count()
        }).from(schema.actors).where(eq(schema.actors.role, "GROWER"));
        const totalGrowers = growerCount[0].total;

        return totalGrowers;
    }

    async countDistributor() {
        const distributorCount = await db.select({
            total: count()
        }).from(schema.actors).where(eq(schema.actors.role, "DISTRIBUTOR"));
        const totalDistributors = distributorCount[0].total;

        return totalDistributors;
    }

    async countRetailer() {
        const retailerCount = await db.select({
            total: count()
        }).from(schema.actors).where(eq(schema.actors.role, "RETAILER"));
        const totalRetailers = retailerCount[0].total;

        return totalRetailers;
    }
}

export default ActorService;