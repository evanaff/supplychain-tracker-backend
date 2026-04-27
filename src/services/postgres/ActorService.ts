import { isAddress } from "ethers";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import InvariantError from "../../common/exceptions/InvariantError";
import * as schema from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "../../lib/db";
import { getContract } from "../../lib/contract";

type DB = NodePgDatabase<typeof schema>;

class ActorService {
    async addActor(
        blockchainAddress: string,
        gln: string,
        role: string,
        name: string,
        conn: DB
    ) {
        if (!isAddress(blockchainAddress)){
            throw new InvariantError("Invalid ethereum address");
        }

        const lowerCaseBlockchainAddress = blockchainAddress.toLowerCase();
        
        const exist = await conn.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, lowerCaseBlockchainAddress)
        });
        
        if (exist) {
            throw new InvariantError("User is already registered");
        }

        const contract = getContract();

        let tx
        switch (role) {
            case "GROWER":
                tx = await contract.addGrower(blockchainAddress, gln);
                await tx.wait();
                break;
            case "DISTRIBUTOR":
                tx = await contract.addDistributor(blockchainAddress, gln);
                await tx.wait();
                break;
                case "RETAILER":
                tx = await contract.addRetailer(blockchainAddress, gln);
                await tx.wait();
                break;
            default:
                throw new InvariantError("Invalid role")
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
}

export default ActorService;