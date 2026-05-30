import { and, eq, ilike } from "drizzle-orm";

import { db } from "../../lib/db";
import * as schema from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { ListActorsQueryDTO, CreateActorDTO, EditActorDTO } from "../../common/dto";

class ActorService {
    async createActor(data: CreateActorDTO) {
        const exist = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, data.blockchainAddress)
        });
        if (exist) {
            throw new InvariantError("User is already registered");
        }

        const result = await db.insert(schema.actors).values({
            blockchainAddress: data.blockchainAddress,
            name: data.name,
            role: data.role
        }).returning();
        if (!result) {
            throw new InvariantError("Failed to add actor");
        }

        return result[0];
    }

    async listActors(query: ListActorsQueryDTO) {
        const {
            page = 1,
            limit = 10,
            role,
            search
        } = query;

        const offset = (page - 1) * limit;

        const conditions = [];

        if (role) {
            conditions.push(eq(schema.actors.role, role));
        }

        if (search) {
            conditions.push(
                ilike(schema.actors.name, `%${search}%`)
            );
        }

        const actorRecords = await db.query.actors.findMany({
            where: conditions.length > 0
                ? and(...conditions)
                : undefined,
            limit,
            offset
        });

        return actorRecords;
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

    async editActorByBlockchainAddress(
        address: string,
        data: EditActorDTO
    ) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, address)
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found");
        }

        await db.update(schema.actors).set({
            name: data.name,
            role: data.role
        });
    }
}

export default ActorService;