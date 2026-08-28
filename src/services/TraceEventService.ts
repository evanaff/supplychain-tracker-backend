import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { AbiCoder, ethers, keccak256, toUtf8Bytes } from "ethers";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import NotFoundError from "../common/exceptions/NotFoundError";
import InvariantError from "../common/exceptions/InvariantError";
import { CreateTraceEventDTO } from "../types/dataTransferObject";
import { SupplyChainActivity } from "../types/types";
import { contract } from "../lib/contract";

class TraceEventService {
    // -------------------------------
    // PosgreSQL / Database Methods
    // -------------------------------

    async getTraceEventsByTraceProductId(traceProductId: string) {
        const traceEvents = await db.query.traceEvents.findMany({
            where: eq(schema.traceEvents.traceProductId, traceProductId),
            orderBy: schema.traceEvents.timestamp,
        });

        return traceEvents;
    }

    async createTraceEvent(
        address: string,
        payload: CreateTraceEventDTO,
    ) {
        await this.validateTraceEventSequence(address, payload);

        let destinationLocationRecord;
        if (payload.destinationLocationGln && payload.supplyChainActivity == "SHIPPING") {
            destinationLocationRecord = await db.query.locations.findFirst({
                where: eq(schema.locations.gln, payload.destinationLocationGln)
            });
            if (!destinationLocationRecord) {
                throw new NotFoundError("Destination location not found");
            }
        }

        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, address),
            with: {
                location: true
            }
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found");
        }

        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(schema.traceProducts.id, payload.traceProductId),
            with: {
                product: true,
            }
        });
        if (!traceProductRecord) {
            throw new NotFoundError("Trace product not found")
        }

        const id = `TRE-${nanoid(6)}`;
        const result = await db.insert(schema.traceEvents).values({
            id,
            traceProductId: payload.traceProductId,
            traceProductJson: {
                id: traceProductRecord.id,
                lotNumber: traceProductRecord.lotNumber,
                quantity: traceProductRecord.quantity
            },
            productJson: {
                gtin: traceProductRecord.product.gtin,
                varietyName: traceProductRecord.product.varietyName,
                unitOfMeasure: traceProductRecord.product.unitOfMeasure,
                imageUrl: traceProductRecord.product.imageUrl
            },
            actorJson: {
                blockchainAddress: actorRecord.blockchainAddress,
                name: actorRecord.name,
                role: actorRecord.role
            },
            sourceLocationJson: {
                gln: actorRecord.location.gln,
                name: actorRecord.location.name,
                province: actorRecord.location.province,
                city: actorRecord.location.city,
                address: actorRecord.location.address
            },
            destinationLocationJson: destinationLocationRecord 
            ? {
                gln: destinationLocationRecord.gln,
                name: destinationLocationRecord.name,
                province: destinationLocationRecord.province,
                city: destinationLocationRecord.city,
                address: destinationLocationRecord.address
            } 
            : null,
            supplyChainActivity: payload.supplyChainActivity,
        }).returning();

        await db.update(schema.traceProducts).set({
            currentActivity: payload.supplyChainActivity,
            currentOwnerBlockchainAddress: address
        }).where(eq(schema.traceProducts.id, payload.traceProductId));

        return result[0]
    }

    async validateTraceEventSequence(
        address: string,
        payload: CreateTraceEventDTO
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

        switch (payload.supplyChainActivity) {
            case "HARVESTING":
                if (traceProduct.currentActivity !== "CREATED" || lastTraceEvent) {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (actorRecord.role !== "GROWER") {
                    throw new InvariantError("Invalid actor role");
                }
                break;
        
            case "SHIPPING":
                if (!lastTraceEvent || lastTraceEvent.supplyChainActivity === "SHIPPING" || lastTraceEvent.supplyChainActivity === "SELLING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (!lastTraceEvent.isSubmitted) {
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
                if (actorRecord.role === "RETAILER") {
                    throw new InvariantError("Invalid actor role");
                }
                break;
        
            case "RECEIVING":
                if (!lastTraceEvent || lastTraceEvent.supplyChainActivity !== "SHIPPING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (actorRecord.locationGln !== lastTraceEvent.destinationLocationJson?.gln) {
                    throw new InvariantError("Invalid location of receiving destination");
                }
                if (actorRecord.role === "GROWER") {
                    throw new InvariantError("Invalid actor role");
                }
                break;
        
            case "SELLING":
                if (!lastTraceEvent || lastTraceEvent.supplyChainActivity !== "RECEIVING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (!lastTraceEvent.isSubmitted) {
                    throw new InvariantError("Last event is not recorded on blockchain")
                }
                if (actorRecord.role !== "RETAILER") {
                    throw new InvariantError("Invalid actor role");
                }
                break;
        
            default:
                break;
        }
    }

    async getTraceEventByIdFromDatabase(id: string) {
        const traceEventRecord = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, id),
            with: {
                traceProduct: {
                    with: {
                        product: true
                    }
                },
            }
        });

        if (!traceEventRecord) {
            throw new NotFoundError("Trace event not found");
        }

        return traceEventRecord
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

        const jsonPayload = {
            traceProductId: traceEvent.traceProductId,
            traceProduct: traceEvent.traceProductJson,
            product: traceEvent.productJson,
            actor: traceEvent.actorJson,
            sourceLocation: traceEvent.sourceLocationJson,
            destinationLocation: traceEvent.destinationLocationJson,
            supplyChainActivity: traceEvent.supplyChainActivity,
            timestamp,
        };
        const stringPayload = JSON.stringify(jsonPayload); 
        
        const dataHash = keccak256(toUtf8Bytes(stringPayload));

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
                ["string", "address", "bytes32"],
                [
                    traceEvent.id, 
                    traceEvent.actorJson.blockchainAddress, 
                    dataHash
                ]
            )
        );

        return messageHash;
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

    async saveTxHash(traceEventId: string, txHash: string) {
        const traceEventRecord = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, traceEventId)
        });
        if (!traceEventRecord) {
            throw new NotFoundError("Trace event not found");
        }

        await db.update(schema.traceEvents).set({
            txHash,
            isSubmitted: true
        }).where(eq(schema.traceEvents.id, traceEventId));
    }

    // -------------------------------
    // Ethereum / Blockchain Methods
    // -------------------------------

    async getTraceEventByIdFromBlockchain(traceEventId: string) {
        const traceEventDb = await db.query.traceEvents.findFirst({
            where: eq(schema.traceEvents.id, traceEventId)
        });
        if (!traceEventDb) {
            throw new NotFoundError("Trace event not found");
        }

        let traceEventEth
        try {
            traceEventEth = await contract.getTraceEventById(traceEventId);
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }

        return traceEventEth;
    }
}

export default TraceEventService
