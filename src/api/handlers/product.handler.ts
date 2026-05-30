import { type Request, type Response, type NextFunction } from "express";

import ProductService from "../../services/database/ProductService";
import { ListProductsQueryDTO } from "../../common/dto";

const productService = new ProductService();

export const getListProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Query
        const query: ListProductsQueryDTO = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search as string | undefined
        }

        // List Products
        const products = await productService.listProducts(query);

        res.json({
            status: "success",
            data: {
                products
            }
        });
    } catch (error) {
        next(error);
    }
}