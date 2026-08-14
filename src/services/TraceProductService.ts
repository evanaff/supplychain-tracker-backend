import { and, desc, eq, ilike, like, or, count } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import NotFoundError from "../common/exceptions/NotFoundError";
import { CreateTraceProductDTO, ListTraceProductsQueryDTO } from "../types/dataTransferObject";
import { Role } from "../types/types";


class TraceProductService {
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

    async generateLotNumber(gtin: string) {
        const today = new Date().toISOString().slice(0, 10);

        const lastLot = await db.query.traceProducts.findFirst({
            where: and(
                eq(schema.traceProducts.gtin, gtin),
                like(schema.traceProducts.lotNumber, `%${today}%`)
            ),
            orderBy: (traceProducts, { desc }) => [desc(traceProducts.lotNumber)]
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

export default TraceProductService