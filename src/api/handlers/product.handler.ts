import { type Request, type Response, type NextFunction } from "express";

import InvariantError from "../../common/exceptions/InvariantError";
import StorageService from "../../services/storage/StorageService";
import ProductService from "../../services/database/ProductService";
import ProductValidator from "../../validator/product";

const storageService = new StorageService();
const productService = new ProductService();

export const postCreateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        ProductValidator.validateCreateProductSchema(payload);
        const { name } = payload;

        const file = req.file;
        if (!file) {
            throw new InvariantError("Image file required");
        }

        const imageUrl = await storageService.uploadImage(file.buffer, file.originalname, "products", file.mimetype);

        const product = await productService.createProduct(name, imageUrl);

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

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await productService.getAllProducts();

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

export const getSearchProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const keyword = req.query.keyword as string;

        if (!keyword) {
            throw new InvariantError("Keyword is required");
        }

        const products = await productService.searchProduct(keyword);

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