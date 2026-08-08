import { and, count, ilike } from "drizzle-orm";

import { db } from "../../lib/db";
import { products } from "../../lib/db/schema";
import { ListProductsQueryDTO } from "../../types/dataTransferObject";

class ProductService {
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
                ilike(products.varietyName, `%${search}%`)
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
}

export default ProductService;