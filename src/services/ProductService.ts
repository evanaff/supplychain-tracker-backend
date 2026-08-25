import { and, count, ilike, or } from "drizzle-orm";

import { db } from "../lib/db";
import { products } from "../lib/db/schema";
import { CreateProductDTO, ListProductsQueryDTO } from "../types/dataTransferObject";

class ProductService {
    async createProduct(payload: CreateProductDTO, imageUrl: string) {
        const product = await db.insert(products).values({
            gtin: payload.gtin,
            varietyName: payload.varietyName,
            unitOfMeasure: payload.unitOfMeasure,
            imageUrl
        }).returning();

        return product[0];
    }

    async listProducts(query: ListProductsQueryDTO) {
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
                    ilike(products.gtin, `%${search}%`),
                    ilike(products.varietyName, `%${search}%`)
                )
            )
        }

        const whereClause = conditions.length > 0
                                ? and(...conditions)
                                : undefined;

        const productRecords = await db.query.products.findMany({
            where: whereClause,
            limit,
            offset
        });

        const totalItemCount = await db.select({
            total: count()
        }).from(products).where(whereClause);
        const totalItems = totalItemCount[0].total;

        const totalPages = Math.ceil(totalItems/limit);

        return {
            products: productRecords,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages
            }
        }
    }

    async countProduct() {
        const productCount = await db.select({
            total: count()
        }).from(products);
        const totalProducts = productCount[0].total;

        return totalProducts;
    }
}

export default ProductService;