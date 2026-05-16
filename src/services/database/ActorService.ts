import { NodePgDatabase } from "drizzle-orm/node-postgres";

import InvariantError from "../../common/exceptions/InvariantError";
import * as schema from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import NotFoundError from "../../common/exceptions/NotFoundError";

type DB = NodePgDatabase<typeof schema>;

class ActordbService {
    async addActor(
        blockchainAddress: string,
        gln: string,
        role: string,
        name: string,
        conn: DB
    ) {
        const lowerCaseBlockchainAddress = blockchainAddress.toLowerCase();
        
        const exist = await conn.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, lowerCaseBlockchainAddress)
        });
        
        if (exist) {
            throw new InvariantError("User is already registered");
        }

        const result = await conn.insert(schema.actors).values({
            blockchainAddress: lowerCaseBlockchainAddress,
            gln: gln,
            role: role,
            name: name
        }).returning();

        if (!result) {
            throw new InvariantError("Failed to add actor");
        }

        return result[0];
    }

    async getAllActors() {
        const actors = await db.query.actors.findMany();
        return actors;
    }

    async deleteActorByAddress(address: string) {
        const lowerCaseAddress = address.toLowerCase();
        const actor = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, lowerCaseAddress)
        });

        if (!actor) {
            throw new NotFoundError("Actor not found");
        }

        await db.delete(schema.actors).where(eq(schema.actors.blockchainAddress, lowerCaseAddress));
    }
}

export default ActordbService;