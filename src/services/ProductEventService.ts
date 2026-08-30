import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { AbiCoder, ethers, keccak256, toUtf8Bytes } from "ethers";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import NotFoundError from "../common/exceptions/NotFoundError";
import InvariantError from "../common/exceptions/InvariantError";
import { CreateProductEventDTO } from "../types/dataTransferObject";
import { contract } from "../lib/contract";

class ProductEventService {
    // -------------------------------
    // PosgreSQL / Database Methods
    // -------------------------------

    async getProductEventsByProductLotId(productLotId: string) {
        const ProductEvents = await db.query.productEvents.findMany({
            where: eq(schema.productEvents.productLotId, productLotId),
            orderBy: schema.productEvents.timestamp,
        });

        return ProductEvents;
    }

    async createProductEvent(
        address: string,
        payload: CreateProductEventDTO,
    ) {
        await this.validateProductEventSequence(address, payload);

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

        const productLotRecord = await db.query.productLots.findFirst({
            where: eq(schema.productLots.id, payload.productLotId),
            with: {
                product: true,
            }
        });
        if (!productLotRecord) {
            throw new NotFoundError("Product lot not found")
        }

        const id = `PE-${nanoid(6)}`;
        const result = await db.insert(schema.productEvents).values({
            id,
            productLotId: payload.productLotId,
            productLotsJson: {
                id: productLotRecord.id,
                lotNumber: productLotRecord.lotNumber,
                quantity: productLotRecord.quantity
            },
            productJson: {
                gtin: productLotRecord.product.gtin,
                varietyName: productLotRecord.product.varietyName,
                unitOfMeasure: productLotRecord.product.unitOfMeasure,
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

        await db.update(schema.productLots).set({
            currentActivity: payload.supplyChainActivity,
            currentOwnerBlockchainAddress: address
        }).where(eq(schema.productLots.id, payload.productLotId));

        return result[0]
    }

    async validateProductEventSequence(
        address: string,
        payload: CreateProductEventDTO
    ) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, address)
        });
        if (!actorRecord) {
            throw new NotFoundError("Actor not found");
        }
        
        const productLot = await db.query.productLots.findFirst({
            where: eq(schema.productLots.id, payload.productLotId),
        });
        if (!productLot) {
            throw new NotFoundError("Product lot not found")
        }
        
        const currentOwner = await db.query.actors.findFirst({
            where: eq(schema.actors.blockchainAddress, productLot.currentOwnerBlockchainAddress),
        });
        if (!currentOwner) {
            throw new NotFoundError("Actor not found");
        }

        const lastProductEvent = await this.getLastProductEvent(payload.productLotId);

        switch (payload.supplyChainActivity) {
            case "HARVESTING":
                if (productLot.currentActivity !== "CREATED" || lastProductEvent) {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (actorRecord.role !== "GROWER") {
                    throw new InvariantError("Invalid actor role");
                }
                break;
        
            case "SHIPPING":
                if (!lastProductEvent || lastProductEvent.supplyChainActivity === "SHIPPING" || lastProductEvent.supplyChainActivity === "SELLING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (!lastProductEvent.txHash) {
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
                if (!lastProductEvent || lastProductEvent.supplyChainActivity !== "SHIPPING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (actorRecord.locationGln !== lastProductEvent.destinationLocationJson?.gln) {
                    throw new InvariantError("Invalid location of receiving destination");
                }
                if (actorRecord.role === "GROWER") {
                    throw new InvariantError("Invalid actor role");
                }
                break;
        
            case "SELLING":
                if (!lastProductEvent || lastProductEvent.supplyChainActivity !== "RECEIVING") {
                    throw new InvariantError("Invalid supply chain step sequence");
                }
                if (!lastProductEvent.txHash) {
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

    async getProductEventByIdFromDatabase(id: string) {
        const ProductEventRecord = await db.query.productEvents.findFirst({
            where: eq(schema.productEvents.id, id),
            with: {
                productLot: {
                    with: {
                        product: true
                    }
                },
            }
        });

        if (!ProductEventRecord) {
            throw new NotFoundError("Product event not found");
        }

        return ProductEventRecord
    }

    async generateDataHash(ProductEventId: string) {
        const ProductEvent = await db.query.productEvents.findFirst({
            where: eq(schema.productEvents.id, ProductEventId)
        });
        if (!ProductEvent) {
            throw new NotFoundError("Product event not found");
        }

        const timestamp =
            typeof ProductEvent.timestamp === "string"
                ? ProductEvent.timestamp
                : ProductEvent.timestamp.toISOString();

        const jsonPayload = {
            productLotId: ProductEvent.productLotId,
            productLot: ProductEvent.productLotsJson,
            product: ProductEvent.productJson,
            actor: ProductEvent.actorJson,
            sourceLocation: ProductEvent.sourceLocationJson,
            destinationLocation: ProductEvent.destinationLocationJson,
            supplyChainActivity: ProductEvent.supplyChainActivity,
            timestamp,
        };
        const stringPayload = JSON.stringify(jsonPayload); 
        
        const dataHash = keccak256(toUtf8Bytes(stringPayload));

        return dataHash
    }

    async generateMessageHash(
        ProductEventId: string,
        dataHash: string
    ) {
        const productEvent = await db.query.productEvents.findFirst({
            where: eq(schema.productEvents.id, ProductEventId)
        });
        if (!productEvent) {
            throw new NotFoundError("Product event not found");
        }

        const abiCoder = AbiCoder.defaultAbiCoder();

        const messageHash = keccak256(
            abiCoder.encode(
                ["string", "string", "address", "bytes32"],
                [
                    productEvent.id,
                    productEvent.productLotId,
                    productEvent.actorJson.blockchainAddress, 
                    dataHash
                ]
            )
        );

        return messageHash;
    }

    async getLastProductEvent(productLotId: string) {
        const productLotRecord = await db.query.productLots.findFirst({
            where: eq(schema.productLots.id, productLotId)
        });
        if (!productLotRecord) {
            throw new NotFoundError("Product lot not found");
        }
        
        const ProductEventRecords = await db.query.productEvents.findMany({
            where: eq(schema.productEvents.productLotId, productLotId),
            orderBy: desc(schema.productEvents.timestamp)
        });

        return ProductEventRecords[0];
    }

    async saveTxHash(ProductEventId: string, txHash: string) {
        const ProductEventRecord = await db.query.productEvents.findFirst({
            where: eq(schema.productEvents.id, ProductEventId)
        });
        if (!ProductEventRecord) {
            throw new NotFoundError("Product event not found");
        }

        await db.update(schema.productEvents).set({
            txHash,
        }).where(eq(schema.productEvents.id, ProductEventId));
    }

    // -------------------------------
    // Ethereum / Blockchain Methods
    // -------------------------------

    async getProductEventByIdFromBlockchain(ProductEventId: string) {
        try {
            const productEventEth = await contract.productEvents(ProductEventId);

            return productEventEth;
        } catch (error: any) {
            throw new InvariantError(`Blockchain transaction failed: ${error.reason}`);
        }
    }
}

export default ProductEventService
