import { NodePgDatabase } from "drizzle-orm/node-postgres";

import InvariantError from "../../common/exceptions/InvariantError";
import * as schema from "../../lib/db/schema";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm";

type DB = NodePgDatabase<typeof schema>;

class LocationService {
    async addLocation(
        name: string,
        address: string,
        role: string,
        conn: DB
    ) {
        const gln = await this.generateGln();

        let type
        switch (role) {
            case "GROWER":
                type = "FARM"
                break;
            case "DISTRIBUTOR":
                type = "WAREHOUSE"
                break;
                case "RETAILER":
                type = "STORE"
                break;
            default:
                throw new InvariantError("Invalid role")
        }

        const result = await conn.insert(schema.locations).values({
            gln,
            name,
            address,
            type
        }).returning();

        if (!result) {
            throw new InvariantError("Failed to add location");
        }

        return result[0];
    }

    async generateGln() {
        while (true) {
            let gln = "";
    
            for (let i = 0; i < 13; i++) {
                gln += Math.floor(Math.random() * 10);
            }
    
            const exist = await db.query.locations.findFirst({
                where: eq(schema.locations.gln, gln)
            })
            
            if (!exist){
                return gln;
            }
        }
    }
}

export default LocationService;