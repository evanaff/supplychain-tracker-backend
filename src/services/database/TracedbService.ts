import { and, eq, like, ne, desc, count, ilike, or } from "drizzle-orm";
import { AbiCoder, keccak256, solidityPackedKeccak256 } from "ethers";
import { nanoid } from "nanoid";

import { db } from "../../lib/db";
import * as schema from "../../lib/db/schema";
import InvariantError from "../../common/exceptions/InvariantError";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { CreateTraceEventDTO, CreateTraceProductDTO, ListTraceProductsQueryDTO, Role, SupplyChainActivity } from "../../common/dto";

class TracedbService {
    // -----------------------
    // Trace Product Methods
    // -----------------------

    async createTraceProduct(
        address: string,
        payload: CreateTraceProductDTO
    ) {
        const productRecord = await db.query.products.findFirst({
            where: eq(schema.products.gtin, payload.gtin)
        });
        if (!productRecord) {
            throw new NotFoundError("Product not found");
        }

        const id = `TRP-${nanoid(6)}`
        const lotNumber = await this.generateLotNumber(payload.gtin);
        
        const result = await db.insert(schema.traceProducts).values({
            id,
            creatorBlockchainAddress: address,
            currentOwnerBlockchainAddress: address,
            gtin: payload.gtin,
            quantity: payload.quantity,
            lotNumber,
        }).returning();

        return result[0];
    }

    async listTraceProducts(
        address: string,
        role: Role,
        query: ListTraceProductsQueryDTO
    ) {
        const {
            page = 1,
            limit = 10,
            search,
            filter
        } = query;

        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    ilike(schema.traceProducts.id, `%${search}%`),
                    ilike(schema.traceProducts.lotNumber, `%${search}%`)
                )
            )
        }

        if (filter) {
            conditions.push(eq(schema.traceProducts.currentActivity, filter));
        }

        if (role === "GROWER") {
            conditions.push(eq(schema.traceProducts.creatorBlockchainAddress, address));
        }
        
        if (role === "DISTRIBUTOR" || role === "RETAILER") {
            conditions.push(eq(schema.traceProducts.currentOwnerBlockchainAddress, address));
        }

        const whereClause = conditions.length > 0
                                ? and(...conditions)
                                : undefined;

        const traceProductRecords = await db.query.traceProducts.findMany({
            where: whereClause,
            limit,
            offset,
            with: {
                product: true
            },
            orderBy: desc(schema.traceProducts.createdAt)
        });

        const totalItemCount = await db.select({
            total: count()
        }).from(schema.traceProducts).where(whereClause);
        const totalItems = totalItemCount[0].total;

        const totalPages = Math.ceil(totalItems/limit);

        return {
            traceProducts: traceProductRecords,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        }
    }

    async getTraceProductById(id: string) {
        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, id),
            with: {
                product: true,
                owner: {
                    with: {
                        location: true
                    }
                }
            }
        });

        if (!traceProductRecord) {
            throw new NotFoundError("Trace product not found");
        }

        return traceProductRecord;
    }

    async getTraceEventsByTraceProductId(traceProductId: string) {
        const traceEvents = await db.query.traceEvents.findMany({
            where: eq(schema.traceEvents.traceProductId, traceProductId),
            orderBy: schema.traceEvents.timestamp,
            with: {
                actor: {
                    with: {
                        location: true
                    }
                },
                destinationLocation: true
            }
        });

        return traceEvents;
    }

    // ----------------------
    // Trace Event Methods
    // ----------------------

    async createTraceEvent(
        address: string,
        payload: CreateTraceEventDTO,
        activity: SupplyChainActivity
    ) {        
        if (payload.destinationLocationGln) {
            const destinationLocationRecord = await db.query.locations.findFirst({
                where: eq(schema.locations.gln, payload.destinationLocationGln)
            });
            if (!destinationLocationRecord) {
                throw new NotFoundError("Destination location not found")
            }
        }

        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, payload.traceProductId)
        });
        if (!traceProductRecord) {
            throw new NotFoundError("Trace product not found")
        }

        const id = `TRE-${nanoid(6)}`;

        const result = await db.insert(schema.traceEvents).values({
            id,
            traceProductId: payload.traceProductId,
            actorBlockchainAddress: address,
            destinationLocationGln: payload.destinationLocationGln,
            supplyChainActivity: activity,
        }).returning();

        await db.update(schema.traceProducts).set({
            currentActivity: activity,
            currentOwnerBlockchainAddress: address
        }).where(eq(schema.traceProducts.id, payload.traceProductId));

        return result[0]
    }

    async validateTraceEventSequence(
        address: string,
        payload: CreateTraceEventDTO,
        activity: SupplyChainActivity,
    ) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, address)
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found");
        }
        
        const traceProduct = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, payload.traceProductId),
        });
        if (!traceProduct) {
            throw new NotFoundError("Trace product not found")
        }
        
        const currentOwner = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, traceProduct.currentOwnerBlockchainAddress),
        });
        if (!currentOwner) {
            throw new NotFoundError("Actor not found");
        }

        const lastTraceEvent = await this.getLastTraceEvent(payload.traceProductId);

        switch (activity) {
            case "HARVESTING":
                if (traceProduct.currentActivity !== "CREATED" || lastTraceEvent) {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                break;
        
            case "SHIPPING":
                if (lastTraceEvent.supplyChainActivity === "SHIPPING" || lastTraceEvent.supplyChainActivity === "SELLING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (lastTraceEvent.validationStatus === "PENDING") {
                    throw new InvariantError("Last event is not recorded on blockchain")
                }
                if (actorRecord.locationGln !== currentOwner.locationGln) {
                    throw new InvariantError("Source GLN must be the same as last event source GLN")
                }
                if (!payload.destinationLocationGln) {
                    throw new InvariantError("Destination GLN of shipping event cannot be empty")
                }
                if (actorRecord.locationGln === payload.destinationLocationGln) {
                    throw new InvariantError("Source location and destination location must be different")
                }
                break;
        
            case "RECEIVING":
                if (lastTraceEvent.supplyChainActivity !== "SHIPPING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (lastTraceEvent.validationStatus === "PENDING") {
                    throw new InvariantError("Last event is not recorded on blockchain")
                }
                if (actorRecord.locationGln !== lastTraceEvent.destinationLocationGln) {
                    throw new InvariantError("Invalid location of receiving destination");
                }
                break;
        
            case "SELLING":
                if (lastTraceEvent.supplyChainActivity !== "RECEIVING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (lastTraceEvent.validationStatus === "PENDING") {
                    throw new InvariantError("Last event is not recorded on blockchain")
                }
                break;
        
            default:
                break;
        }
    }

    async getTraceEventById(id: string) {
        const traceEventRecord = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, id),
            with: {
                traceProduct: {
                    with: {
                        product: true
                    }
                },
                actor: {
                    with: {
                        location: true
                    }
                }
            }
        });

        if (!traceEventRecord) {
            throw new NotFoundError("Trace event not found");
        }

        return traceEventRecord
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
            ["string", "address", "string", "string", "string"],
            [
                traceEvent.traceProductId,
                traceEvent.actorBlockchainAddress,
                traceEvent.destinationLocationGln ?? "",
                traceEvent.supplyChainActivity,
                timestamp
            ]
        );

        return dataHash
    }

    async generateMessageHash(
        traceEventId: string,
        dataHash: string
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, traceEventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        const abiCoder = AbiCoder.defaultAbiCoder();

        const messageHash = keccak256(
            abiCoder.encode(
                ["string", "string", "address", "bytes32"],
                [
                    traceEvent.id, 
                    traceEvent.traceProductId, 
                    traceEvent.actorBlockchainAddress, 
                    dataHash
                ]
            )
        );

        return messageHash;
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
            schema.actors,
            eq(schema.traceProducts.currentOwnerBlockchainAddress, schema.actors.blockchainAddress)
        ).where(and(
            eq(schema.traceProducts.currentActivity, "SHIPPING"),
            eq(schema.actors.blockchainAddress, address)
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
        const today = new Date().toISOString().slice(0, 10);

        const lastLot = await db.query.traceProducts.findFirst({
            where: and(
                eq(schema.traceProducts.gtin, gtin),
                like(schema.traceProducts.lotNumber, `%${today}%`)
            ),
            orderBy: (traceProducts, { desc }) => [desc(traceProducts.lotNumber)]
        });
        console.log(lastLot);

        let sequence = 1

        if (lastLot) {
            const lastSeq = parseInt(lastLot.lotNumber.split('-')[4]);
            sequence += lastSeq;
        }

        const sequenceStr = sequence.toString().padStart(3, "0");
   
        return `LOT-${today}-${sequenceStr}`
    }
}

export default TracedbService;