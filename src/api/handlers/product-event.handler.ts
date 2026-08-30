import { type Request, type Response, type NextFunction } from "express";

import ProductEventService from "../../services/ProductEventService";
import ProductEventValidator from "../../validator/product-event";
import AuthorizationError from "../../common/exceptions/AuthorizationError";

const productEventService = new ProductEventService();

export const postCreateProductEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        // Validate Payload
        const payload = req.body;
        ProductEventValidator.validateCreateProductEventPayloadSchema(payload);

        // Create Product Event
        const productEvent = await productEventService.createProductEvent(userAddress, payload);

        res.status(201).json({
            status: "success",
            message: "Product event created successfully",
            data: {
                productEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getEventHashHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const productEventId = req.params.id as string;

        // Generate Message Hash
        const dataHash = await productEventService.generateDataHash(productEventId);
        const messageHash = await productEventService.generateMessageHash(productEventId, dataHash);

        res.json({
            status: "success",
            data: {
                messageHash,
                dataHash
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postSaveTxHashHandler =  async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const productEventId = req.params.id as string;

        // Validate Payload
        const payload = req.body;
        ProductEventValidator.validateSaveTxHashPayloadSchema(payload);

        // Save Tx Hash
        await productEventService.saveTxHash(productEventId, payload.txHash);
        
        res.json({
            status: "success",
            message: "Tx hash saved successfully"
        })
    } catch (error) {
        next(error)
    }
}