import { and, eq, like } from "drizzle-orm";
import { db } from "../../lib/db";
import { actors, products, productTypes, traceEvents } from "../../lib/db/schema";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { isAddress, solidityPackedKeccak256 } from "ethers";
import InvariantError from "../../common/exceptions/InvariantError";
import { desc } from "drizzle-orm";

class ProductdbService {
    async createProduct(gtin: string, creatorBlockchainAddress: string) {
        if (!isAddress(creatorBlockchainAddress)) {
            throw new InvariantError("Invalid ethereum address")
        }
        const productType = await db.query.productTypes.findFirst({
            where: eq(productTypes.gtin, gtin)
        });
        if (!productType) {
            throw new NotFoundError("Product type not found");
        }
        const lotNumber = await this.generateLotNumber(gtin);
        const product = await db.insert(products).values({
            creatorBlockchainAddress,
            gtin,
            lotNumber
        }).returning();

        return product[0];
    }

    async validateSupplyChainStep(productId: number, supplychainStep: string) {
        const traceEventRecords = await db.query.traceEvents.findMany({
            where: eq(traceEvents.productId, productId),
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

    async createTraceEvent(productId: number, actorBlockchainAddress: string, supplychainStep: string) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(actors.blockchainAddress, actorBlockchainAddress)
        });
        if (!actorRecord){
            throw new NotFoundError("Actor not found")
        }
        const gln = actorRecord.gln;

        const productRecord = await db.query.products.findFirst({
            where: eq(products.productId, productId)
        });
        if (!productRecord) {
            throw new NotFoundError("Product not found")
        }

        const traceEvent = await db.insert(traceEvents).values({
            productId,
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
            where: eq(traceEvents.eventId, eventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }
        const updatedTraceEvent = await db.update(traceEvents).set({
            txHash
        }).where(eq(traceEvents.eventId, eventId)).returning();

        return updatedTraceEvent[0];
    }

    async computeTraceEventHash(eventId: number) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.eventId, eventId)
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
                traceEvent.eventId,
                traceEvent.productId,
                traceEvent.actorBlockchainAddress,
                traceEvent.gln,
                traceEvent.supplychainStep,
                timestamp
            ]
        );

        return dataHash;
    }

    async getProductHistory(productId: number) {
        const product = await db.query.products.findFirst({
            where: eq(products.productId, productId)
        });
        if (!product) {
            throw new NotFoundError("Product not found")
        };

        const traceEvent = await db.query.traceEvents.findMany({
            where: eq(traceEvents.productId, productId)
        });

        return {product, traceEvent};
    }

    async generateLotNumber(gtin: string) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        const lastLot = await db.query.products.findFirst({
            where: and(
                eq(products.gtin, gtin),
                like(products.lotNumber, `${today}%`)
            ),
            orderBy: (products, { desc }) => [desc(products.lotNumber)]
        });

        let sequence = 1

        if (lastLot) {
            const lastSeq = parseInt(lastLot.lotNumber.split('-')[1]);
            sequence += lastSeq;
        }

        return `${today}-${sequence}`
    }
}

export default ProductdbService;