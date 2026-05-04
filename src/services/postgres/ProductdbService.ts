import { and, eq, like } from "drizzle-orm";
import { db } from "../../lib/db";
import { actors, products, productTypes, traceEvents } from "../../lib/db/schema";
import NotFoundError from "../../common/exceptions/NotFoundError";
import { isAddress, keccak256, toUtf8Bytes } from "ethers";
import InvariantError from "../../common/exceptions/InvariantError";

class ProductdbService {
    // async generateInitialProductData(gtin: string, address: string) {
    //     const productType = await db.query.productTypes.findFirst({
    //         where: eq(productTypes.gtin, gtin)
    //     });
    //     if (!productType) {
    //         throw new NotFoundError("Product type not found");
    //     }

    //     const lotNumber = await this.generateLotNumber(gtin);
    //     const productId = await this.generateProductId();
    //     const product =  {
    //         productId,
    //         gtin,
    //         lotNumber,
    //         creatorBlockchainAddress: address
    //     };

    //     const eventId = await this.generateEventId();
        
    //     const actorRecord = await db.query.actors.findFirst({
    //         where: eq(actors.blockchainAddress, address)
    //     })
    //     if (!actorRecord){
    //         throw new NotFoundError("Actor not found")
    //     }
    //     const gln = actorRecord.gln;
        
    //     const supplyChainStep = "HARVESTING";
    //     const timestamp = new Date().toISOString();

    //     const hashPayload = {
    //         eventId, productId, address, gln, supplyChainStep, timestamp
    //     }
    //     const dataHash = keccak256(toUtf8Bytes(JSON.stringify(hashPayload)));

    //     const traceEvent = {
    //         eventId,
    //         productId,
    //         actorBlockchainAddress: address,
    //         gln,
    //         supplyChainStep,
    //         timestamp,
    //         dataHash
    //     };

    //     return {product, traceEvent};
    // }

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

    async createTraceEvent(productId: number, actorBlockchainAddress: string, supplychainStep: string) {
        const actorRecord = await db.query.actors.findFirst({
            where: eq(actors.blockchainAddress, actorBlockchainAddress)
        });
        if (!actorRecord){
            throw new NotFoundError("Actor not found")
        }
        const gln = actorRecord.gln;
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
        dataHash: string,
        txHash: string
    ) {
        const traceEvent = await db.query.traceEvents.findFirst({
            where: eq(traceEvents.eventId, eventId)
        });
        if (!traceEvent) {
            throw new NotFoundError("Trace event not found");
        }
        const updatedTraceEvent = await db.update(traceEvents).set({
            dataHash,
            txHash
        }).where(eq(traceEvents.eventId, eventId)).returning();

        return updatedTraceEvent[0];
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