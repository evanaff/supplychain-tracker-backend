import { and, eq, ilike, count, or, not, ne } from "drizzle-orm";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import InvariantError from "../common/exceptions/InvariantError";
import NotFoundError from "../common/exceptions/NotFoundError";
import { EditLocationDTO, ListLocationsQueryDTO, type CreateLocationDTO } from "../types/dataTransferObject";

class LocationService {
    async createLocation(payload: CreateLocationDTO) {
        const result = await db.insert(schema.locations).values({
            gln: payload.gln,
            name: payload.name,
            province: payload.province,
            city: payload.city,
            address: payload.address,
            allowedRole: payload.allowedRole
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
                    or(
                        ilike(schema.locations.name, `%${search}%`),
                        ilike(schema.locations.gln, `%${search}%`)
                    )
                );
            }

            conditions.push(not(eq(schema.locations.gln, "0000000000000")));

            const whereClause = conditions.length > 0
                                    ? and(...conditions)
                                    : undefined;
    
            const locationRecords = await db.query.locations.findMany({
                where: whereClause,
                limit,
                offset
            });

            const totalItemCount = await db.select({
                total: count()
            }).from(schema.locations).where(whereClause);
            const totalItems = totalItemCount[0].total;

            const totalPages = Math.ceil(totalItems/limit);
    
            return {
                locations: locationRecords,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            }
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
        payload: EditLocationDTO
    ) {
        const locationRecord = await db.query.locations.findFirst({
            where: eq(schema.locations.gln, gln)
        });
        if (!locationRecord) {
            throw new NotFoundError("Location not found")
        }

        await db.update(schema.locations).set({
            name: payload.name,
            province: payload.province,
            city: payload.city,
            address: payload.address
        }).where(eq(schema.locations.gln, locationRecord.gln));
    }

    async countLocation() {
        const locationCount = await db.select({
            total: count()
        }).from(schema.locations).where(ne(schema.locations.allowedRole, "ADMIN"));
        const totalLocations = locationCount[0].total;

        return totalLocations;
    }
}

export default LocationService;