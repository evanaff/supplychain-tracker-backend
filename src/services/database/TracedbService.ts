import { and, eq, ilike, like, or } from "drizzle-orm";
import { db } from "../../lib/db";
import { actors, products, traceEvents, traceProducts } from "../../lib/db/schema";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { isAddress, solidityPackedKeccak256 } from "ethers";
import InvariantError from "../../common/exceptions/InvariantError";
import { desc } from "drizzle-orm";

class TracedbService {
    async createTraceProduct(gtin: string, creatorBlockchainAddress: string) {
        if (!isAddress(creatorBlockchainAddress)) {
            throw new InvariantError("Invalid ethereum address")
        }
        const productType = await db.query.products.findFirst({
            where: eq(products.gtin, gtin)
        });
        if (!productType) {
            throw new NotFoundError("Product type not found");
        }
        const lotNumber = await this.generateLotNumber(gtin);
        const traceProduct = await db.insert(traceProducts).values({
            creatorBlockchainAddress,
            gtin,
            lotNumber
        }).returning();

        return traceProduct[0];
    }

    async getTraceProductsByAddress(address: string) {
        const traceProductRecords = await db.query.traceProducts.findMany({
            where: eq(traceProducts.creatorBlockchainAddress, address)
        });

        return traceProductRecords;
    }

    async searchTraceProducts(address: string, keyword: string) {
        const records = await db
            .select({
                id: traceProducts.id,
                gtin: traceProducts.gtin,
                lotNumber: traceProducts.lotNumber,
                createdAt: traceProducts.createdAt,

                productName: products.name,
                imageUrl: products.imageUrl,
            })

            .from(traceProducts)

            .innerJoin(
                products,
                eq(traceProducts.gtin, products.gtin)
            )

            .where(
                and(
                    or(
                        ilike(traceProducts.gtin, `%${keyword}%`),
    
                        ilike(traceProducts.lotNumber, `%${keyword}%`),
    
                        ilike(products.name, `%${keyword}%`)
                    ),
                    eq(traceProducts.creatorBlockchainAddress, address)
                )
            )

            .orderBy(desc(traceProducts.createdAt))

            .limit(5);

        return records;
    }

    async getLastTraceEventByTraceProductId(traceProductId: number) {
        const traceProduct = await db.query.traceProducts.findFirst({
            where: eq(traceProducts.id, traceProductId)
        });

        if (!traceProduct) {
            throw new NotFoundError("Trace product not found");
        }
        
        const records = await db.query.traceEvents.findMany({
            where: eq(traceEvents.traceProductId, traceProductId),
            orderBy: desc(traceEvents.timestamp)
        });

        return records[0];
    }

    async validateSupplyChainStep(traceProductId: number, supplychainStep: string) {
        const traceEventRecords = await db.query.traceEvents.findMany({
            where: eq(traceEvents.traceProductId, traceProductId),
            orderBy: desc(traceEvents.timestamp)
        });
        if (traceEventRecords.length === 0) {
            throw new NotFoundError("Initial trace event not found")
        };

        const lastTraceEvent = traceEventRecords[0];
        
        switch (supplychainStep) {
            case "SHIPPING":
                if (lastTraceEvent.supplychainStep === "SHIPPING") {
                    throw new InvariantError("Invalid supplychain step sequence")
                }
                break;
                case "RECEIVING":
                if (lastTraceEvent.supplychainStep === "RECEIVING" || lastTraceEvent.supplychainStep === "HARVESTING") {
                    throw new InvariantError("Invalid supplychain step sequence")
                }
                break;
            default:
                throw new InvariantError("Invalid Supplychain Step")
        }
    }

    async createTraceEvent(traceProductId: number, actorBlockchainAddress: string, supplychainStep: string) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(actors.blockchainAddress, actorBlockchainAddress)
        });
        if (!actorRecord){
            throw new NotFoundError("Actor not found")
        }
        const gln = actorRecord.gln;

        const productRecord = await db.query.traceProducts.findFirst({
            where: eq(traceProducts.id, traceProductId)
        });
        if (!productRecord) {
            throw new NotFoundError("Product not found")
        }

        const traceEvent = await db.insert(traceEvents).values({
            traceProductId,
            actorBlockchainAddress,
            gln,
            supplychainStep,
        }).returning();

        return traceEvent[0];
    }

    async updateTraceEvent(
        eventId: number,
        txHash: string
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, eventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }
        const updatedTraceEvent = await db.update(traceEvents).set({
            txHash,
            onChainStatus: "VERIFIED"
        }).where(eq(traceEvents.id, eventId)).returning();

        return updatedTraceEvent[0];
    }

    async computeTraceEventHash(eventId: number) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.id, eventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }

        const timestamp =
            typeof traceEvent.timestamp === "string"
                ? traceEvent.timestamp
                : traceEvent.timestamp.toISOString();
        const dataHash = solidityPackedKeccak256(
            ["uint256", "uint256", "address", "string", "string", "string"],
            [
                traceEvent.id,
                traceEvent.traceProductId,
                traceEvent.actorBlockchainAddress,
                traceEvent.gln,
                traceEvent.supplychainStep,
                timestamp
            ]
        );

        return dataHash;
    }

    async getTraceProductHistory(traceProductId: number) {
        const traceProductRecord = await db.query.traceProducts.findFirst({
            where: eq(traceProducts.id, traceProductId)
        });
        if (!traceProductRecord) {
            throw new NotFoundError("Trace product not found")
        };

        const productRecord = await db.query.products.findFirst({
            where: eq(products.gtin, traceProductRecord.gtin)
        });

        const traceEventRecords = await db.query.traceEvents.findMany({
            where: eq(traceEvents.traceProductId, traceProductId)
        });

        return {traceProductRecord, productRecord, traceEventRecords};
    }

    async generateLotNumber(gtin: string) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        const lastLot = await db.query.traceProducts.findFirst({
            where: and(
                eq(traceProducts.gtin, gtin),
                like(traceProducts.lotNumber, `${today}%`)
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