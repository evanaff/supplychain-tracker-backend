import { and, ilike } from "drizzle-orm";

import { db } from "../../lib/db";
import { products } from "../../lib/db/schema";
import { ListProductsQueryDTO } from "../../common/dto";

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

        const productRecords = await db.query.products.findMany({
            where: conditions.length > 0
                ? and(...conditions)
                : undefined,
            limit,
            offset
        });

        return productRecords;
    }
}

export default ProductService;