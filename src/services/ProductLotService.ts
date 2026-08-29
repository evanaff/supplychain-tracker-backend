import { and, desc, eq, ilike, like, or, count } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import NotFoundError from "../common/exceptions/NotFoundError";
import { CreateProductLotDTO, ListProductLotsQueryDTO } from "../types/dataTransferObject";


class ProductLotService {
    async createProductLot(
        address: string,
        payload: CreateProductLotDTO
    ) {
        const productRecord = await db.query.products.findFirst({
            where: eq(schema.products.gtin, payload.gtin)
        });
        if (!productRecord) {
            throw new NotFoundError("Product not found");
        }

        const id = `PL-${nanoid(6)}`
        const lotNumber = await this.generateLotNumber(payload.gtin);
        
        const result = await db.insert(schema.productLots).values({
            id,
            creatorBlockchainAddress: address,
            currentOwnerBlockchainAddress: address,
            gtin: payload.gtin,
            quantity: payload.quantity,
            lotNumber,
        }).returning();

        return result[0];
    }

    async listProductLots(
        query: ListProductLotsQueryDTO
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
                    ilike(schema.productLots.id, `%${search}%`),
                    ilike(schema.productLots.lotNumber, `%${search}%`)
                )
            )
        }

        if (filter) {
            conditions.push(eq(schema.productLots.currentActivity, filter));
        }

        const whereClause = conditions.length > 0
                                ? and(...conditions)
                                : undefined;

        const productLotRecords = await db.query.productLots.findMany({
            where: whereClause,
            limit,
            offset,
            with: {
                product: true
            },
            orderBy: desc(schema.productLots.createdAt)
        });

        const totalItemCount = await db.select({
            total: count()
        }).from(schema.productLots).where(whereClause);
        const totalItems = totalItemCount[0].total;

        const totalPages = Math.ceil(totalItems/limit);

        return {
            productLots: productLotRecords,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        }
    }

    async getProductLotById(id: string) {
        const productLotRecord = await db.query.productLots.findFirst({
            where: eq(schema.productLots.id, id),
            with: {
                product: true,
                owner: {
                    with: {
                        location: true
                    }
                }
            }
        });

        if (!productLotRecord) {
            throw new NotFoundError("Product lot not found");
        }

        return productLotRecord;
    }
    
    async countProductLot() {
        const productLotCount = await db.select({
            total: count()
        }).from(schema.productLots);
        const totalProductLots = productLotCount[0].total;

        return totalProductLots;
    }

    async generateLotNumber(gtin: string) {
        const today = new Date().toISOString().slice(0, 10);

        const lastLot = await db.query.productLots.findFirst({
            where: and(
                eq(schema.productLots.gtin, gtin),
                like(schema.productLots.lotNumber, `%${today}%`)
            ),
            orderBy: (ProductLots, { desc }) => [desc(ProductLots.lotNumber)]
        });

        let sequence = 1

        if (lastLot) {
            const lastSeq = parseInt(lastLot.lotNumber.split('-')[4]);
            sequence += lastSeq;
        }

        const sequenceStr = sequence.toString().padStart(3, "0");
   
        return `LOT-${today}-${sequenceStr}`
    }
}

export default ProductLotService