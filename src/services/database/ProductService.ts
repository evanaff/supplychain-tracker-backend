import { ilike, or } from "drizzle-orm";
import { db } from "../../lib/db";
import { products, traceProducts } from "../../lib/db/schema";


class ProductService {
    async createProduct(name: string, imageUrl: string) {
        const gtin = this.generateGtin();

        const product = await db.insert(products).values({
            gtin,
            name,
            imageUrl
        }).returning();

        return product[0];
    }

    async getAllProducts() {
        const products = await db.query.products.findMany();

        return products;
    }

    async searchProduct(keyword: string) {
        const records = await db.query.products.findMany({
            where: or(
                ilike(products.gtin, `%${keyword}%`),
                ilike(products.name, `%${keyword}%`)
            )
        });

        return records;
    }

    generateGtin() {
        let gtin = "";

        for (let i = 0; i < 13; i++) {
            gtin += Math.floor(Math.random() * 10).toString();
        };

        return gtin
    }
}

export default ProductService;