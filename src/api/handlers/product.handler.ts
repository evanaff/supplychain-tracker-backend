import { type Request, type Response, type NextFunction } from "express";

import ProductService from "../../services/ProductService";
import ProductValidator from "../../validator/product";
import { ListProductsQueryDTO } from "../../types/dataTransferObject";
import InvariantError from "../../common/exceptions/InvariantError";
import StorageService from "../../services/StorageService";

const productService = new ProductService();
const storageService = new StorageService();

export const postCreateProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        ProductValidator.validateCreateProductSchema(payload);

        const file = req.file;
        if (!file) {
            throw new InvariantError("Image file required");
        }

        const imageUrl = await storageService.uploadImage(file.buffer, file.originalname, "products", file.mimetype);

        const product = await productService.createProduct(payload, imageUrl);

        res.status(201).json({
            status: "success",
            data: {
                product
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getListProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Query
        const query: ListProductsQueryDTO = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search as string | undefined
        }

        // List Products
        const { products, pagination } = await productService.listProducts(query);

        res.json({
            status: "success",
            data: {
                products,
                pagination
            }
        });
    } catch (error) {
        next(error);
    }
}