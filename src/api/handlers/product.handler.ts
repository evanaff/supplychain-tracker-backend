import { type Request, type Response, type NextFunction } from "express";

import AuthorizationError from "../../common/exceptions/AuthorizationError";
import ProductdbService from "../../services/postgres/ProductdbService";
import ProductEthService from "../../services/ethereum/ProductEthService";
import ProductValidator from "../../validator/product";

const productdbService = new ProductdbService();
const productEthService = new ProductEthService();

export const postCreateInitialProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;
        
        const payload = req.body;
        ProductValidator.validateGenerateProductPayload(payload);
        const { gtin } = payload;
        
        const product = await productdbService.createProduct(gtin, userAddress);
        const traceEvent = await productdbService.createTraceEvent(product.productId, userAddress, "HARVESTING");

        res.json({
            status: 'success',
            data: {
                product,
                traceEvent
            }
        })
    } catch (error) {
        next(error);
    }
}

export const postAddBlockchainTraceEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }

        const payload = req.body;
        ProductValidator.validateInsertProductSchema(payload);
        const { eventId, signature } = payload;

        const dataHash = await productEthService.verifySignature(eventId, signature);
        const txHash = await productEthService.addTraceEvent(eventId, dataHash, signature);
        const updatedTraceEvent = await productdbService.updateTraceEvent(eventId, dataHash, txHash);

        res.status(201).json({
            status: 'success',
            data: {
                traceEvent: updatedTraceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}