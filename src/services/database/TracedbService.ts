import { and, eq, like, ne, desc, count } from "drizzle-orm";
import { solidityPackedKeccak256 } from "ethers";
import { nanoid } from "nanoid";

import { db } from "../../lib/db";
import * as schema from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { CreateTraceEventDTO, CreateTraceProductDTO, ListTraceProductsQueryDTO, SupplyChainActivity } from "../../common/dto";

class TracedbService {
    // -----------------------
    // Trace Product Methods
    // -----------------------

    async createTraceProduct(
        address: string,
        data: CreateTraceProductDTO
    ) {
        const productRecord = await db.query.products.findFirst({
            where: eq(schema.products.gtin, data.gtin)
        });
        if (!productRecord) {
            throw new NotFoundError("Product not found");
        }

        const id = `TRP-${nanoid(6)}`
        const lotNumber = await this.generateLotNumber(data.gtin);
        
        const result = await db.insert(schema.traceProducts).values({
            id,
            creatorBlockchainAddress: address,
            currentOwnerBlockchainAddress: address,
            currentLocationGln: data.gln,
            gtin: data.gtin,
            quantity: data.quantity,
            lotNumber,
            currentActivity: "HARVESTING"
        }).returning();

        return result[0];
    }

    async listTraceProducts(
        address: string,
        query: ListTraceProductsQueryDTO
    ) {
        const {
            page = 1,
            limit = 10,
        } = query;

        const offset = (page - 1) * limit;

        const traceProductRecords = await db.query.traceProducts.findMany({
            where: eq(schema.traceProducts.creatorBlockchainAddress, address),
            limit,
            offset
        });

        return traceProductRecords;
    }

    async getTraceProductById(id: string) {
        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, id),
            with: {
                product: true
            }
        });

        if (!traceProductRecord) {
            throw new InvariantError("Trace product not found");
        }

        return traceProductRecord;
    }

    async getTraceEventsByTraceProductId(traceProductId: string) {
        const traceEvents = await db.query.traceEvents.findMany({
            where: eq(schema.traceEvents.traceProductId, traceProductId),
            orderBy: schema.traceEvents.timestamp
        });

        return traceEvents;
    }

    // ----------------------
    // Trace Event Methods
    // ----------------------

    async createTraceEvent(
        address: string,
        data: CreateTraceEventDTO,
        activity: SupplyChainActivity
    ) {
        const sourceLocationRecord = await db.query.locations.findFirst({
            where: eq(schema.locations.gln, data.sourceLocationGln)
        });
        if (!sourceLocationRecord) {
            throw new NotFoundError("Source location not found")
        }
        
        if (data.destinationLocationGln) {
            const destinationLocationRecord = await db.query.locations.findFirst({
                where: eq(schema.locations.gln, data.destinationLocationGln)
            });
            if (!destinationLocationRecord) {
                throw new NotFoundError("Destination location not found")
            }
        }

        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, data.traceProductId)
        });
        if (!traceProductRecord) {
            throw new NotFoundError("Trace product not found")
        }

        const id = `TRE-${nanoid(6)}`;

        const result = await db.insert(schema.traceEvents).values({
            id,
            traceProductId: data.traceProductId,
            actorBlockchainAddress: address,
            sourceLocationGln: data.sourceLocationGln,
            destinationLocationGln: data.destinationLocationGln,
            supplyChainActivity: activity,
        }).returning();

        return result[0]
    }

    async validateTraceEventSequence(
        data: CreateTraceEventDTO,
        activity: SupplyChainActivity,
    ) {
        const lastTraceEvent = await this.getLastTraceEvent(data.traceProductId);

        switch (activity) {
            case "HARVESTING":
                if (lastTraceEvent) {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                break;
        
            case "SHIPPING":
                if (lastTraceEvent.supplyChainActivity === "SHIPPING" || lastTraceEvent.supplyChainActivity === "SELLING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (data.sourceLocationGln !== lastTraceEvent.sourceLocationGln) {
                    throw new InvariantError("Source GLN must be the same as last event source GLN")
                }
                if (!data.destinationLocationGln) {
                    throw new InvariantError("Destination GLN of shipping event cannot be empty")
                }
                if (data.sourceLocationGln === data.destinationLocationGln) {
                    throw new InvariantError("Source location and destination location must be different")
                }
                break;
        
            case "RECEIVING":
                if (lastTraceEvent.supplyChainActivity !== "SHIPPING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (data.sourceLocationGln !== lastTraceEvent.destinationLocationGln) {
                    throw new InvariantError("Invalid location of receiving destination");
                }
                break;
        
            case "SELLING":
                if (lastTraceEvent.supplyChainActivity !== "RECEIVING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                break;
        
            default:
                break;
        }
    }

    async updateTraceEvent(
        traceEventId: string,
        txHash: string
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, traceEventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }
        const updatedTraceEvent = await db.update(schema.traceEvents).set({
            txHash,
            validationStatus: "VALID"
        }).where(eq(schema.traceEvents.id, traceEventId)).returning();

        return updatedTraceEvent[0];
    }

    async countGrower() {
        const growerCount = await db.select({
            total: count()
        }).from(schema.actors).where(eq(schema.actors.role, "GROWER"));
        const totalGrowers = growerCount[0].total;

        return totalGrowers;
    }

    async generateDataHash(traceEventId: string) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, traceEventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        const timestamp =
            typeof traceEvent.timestamp === "string"
                ? traceEvent.timestamp
                : traceEvent.timestamp.toISOString();
        const dataHash = solidityPackedKeccak256(
            ["string", "address", "string", "string", "string", "string"],
            [
                traceEvent.traceProductId,
                traceEvent.actorBlockchainAddress,
                traceEvent.sourceLocationGln,
                traceEvent.destinationLocationGln ?? "",
                traceEvent.supplyChainActivity,
                timestamp
            ]
        );

        return dataHash
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

    async countLocation() {
        const locationCount = await db.select({
            total: count()
        }).from(schema.locations);
        const totalLocations = locationCount[0].total;

        return totalLocations;
    }

    async countTraceProduct(address: string) {
        const traceProductCount = await db.select({
            total: count()
        }).from(schema.traceProducts).where(eq(schema.traceProducts.creatorBlockchainAddress, address));
        const totalTraceProducts = traceProductCount[0].total;

        return totalTraceProducts
    }

    async countTraceEventActivity(
        address: string,
        activity: SupplyChainActivity
    ) {
        const traceEventCount = await db.select({
            total: count()
        }).from(schema.traceEvents).where(and(
            eq(schema.traceEvents.actorBlockchainAddress, address),
            eq(schema.traceEvents.supplyChainActivity, activity)
        ));
        const totalTraceEvents = traceEventCount[0].total;

        return totalTraceEvents;
    }

    async countSignedEvent(address: string) {
        const signedEventCount = await db.select({
            total: count()
        }).from(schema.traceEvents).where(and(
            eq(schema.traceEvents.actorBlockchainAddress, address),
            ne(schema.traceEvents.validationStatus, "PENDING")
        ));
        const totalSignedEvent = signedEventCount[0].total;

        return totalSignedEvent;
    }

    async countWaitingToReceiveProduct(address: string) {
        const waitingToReceiveProductCount = await db.select({
            total: count()
        }).from(schema.traceProducts).innerJoin(
            schema.actorLocations,
            eq(schema.traceProducts.currentLocationGln, schema.actorLocations.locationGln)
        ).where(and(
            eq(schema.traceProducts.currentActivity, "SHIPPING"),
            eq(schema.actorLocations.actorBlockchainAddress, address)
        ));
        const totalWaitingToReceiveProduct = waitingToReceiveProductCount[0].total;

        return totalWaitingToReceiveProduct;
    }

    async getLastTraceEvent(traceProductId: string) {
        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, traceProductId)
        });
        if (!traceProductRecord) {
            throw new NotFoundError("Trace product not found");
        }
        
        const traceEventRecords = await db.query.traceEvents.findMany({
            where: eq(schema.traceEvents.traceProductId, traceProductId),
            orderBy: desc(schema.traceEvents.timestamp)
        });

        return traceEventRecords[0];
    }

    async generateLotNumber(gtin: string) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        const lastLot = await db.query.traceProducts.findFirst({
            where: and(
                eq(schema.traceProducts.gtin, gtin),
                like(schema.traceProducts.lotNumber, `${today}%`)
            ),
            orderBy: (traceProducts, { desc }) => [desc(traceProducts.lotNumber)]
        });

        let sequence = 1

        if (lastLot) {
            const lastSeq = parseInt(lastLot.lotNumber.split('-')[1]);
            sequence += lastSeq;
        }

        return `${today}-${sequence}`
    }
}

export default TracedbService;