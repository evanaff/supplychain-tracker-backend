import { and, eq, ilike } from "drizzle-orm";

import { db } from "../../lib/db";
import * as schema from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { EditLocationDTO, ListLocationsQueryDTO, type CreateLocationDTO } from "../../common/dto";

class LocationService {
    async createLocation(data: CreateLocationDTO) {
        const gln = this.generateGln();

        const result = await db.insert(schema.locations).values({
            gln,
            name: data.name,
            province: data.province,
            city: data.city,
            address: data.address,
        }).returning();
        if (!result) {
            throw new InvariantError("Failed to add location");
        }

        return result[0];
    }

    async listLocations(query: ListLocationsQueryDTO) {
        const {
                page = 1,
                limit = 10,
                search
            } = query;
    
            const offset = (page - 1) * limit;
    
            const conditions = [];
    
            if (search) {
                conditions.push(
                    ilike(schema.locations.name, `%${search}%`)
                );
            }
    
            const locationRecords = await db.query.locations.findMany({
                where: conditions.length > 0
                    ? and(...conditions)
                    : undefined,
                limit,
                offset
            });
    
            return locationRecords;
    }

    async getLocationByGln(gln: string) {
        const locationRecord = await db.query.locations.findFirst({
            where: eq(schema.locations.gln, gln)
        });
        if (!locationRecord) {
            throw new NotFoundError("Location not found")
        }

        return locationRecord;
    }

    async editLocationByGln(
        gln: string,
        data: EditLocationDTO
    ) {
        const locationRecord = await db.query.locations.findFirst({
            where: eq(schema.locations.gln, gln)
        });
        if (!locationRecord) {
            throw new NotFoundError("Location not found")
        }

        await db.update(schema.locations).set({
            name: data.name,
            province: data.province,
            city: data.city,
            address: data.address
        });
    }

    generateGln() {
        const companyPrefix = "950";

        const randomPart = Array.from({ length: 10 }, () =>
            Math.floor(Math.random() * 10)
        ).join("");

        const gln = `${companyPrefix}${randomPart}`.slice(0, 13);

        return gln;
    }
}

export default LocationService;