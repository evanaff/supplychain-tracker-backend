import { type Request, type Response, type NextFunction } from "express";

import AuthorizationError from "../../common/exceptions/AuthorizationError";
import ProductdbService from "../../services/postgres/ProductdbService";
import ProductEthService from "../../services/ethereum/ProductEthService";
import ProductValidator from "../../validator/product";
import InvariantError from "../../common/exceptions/InvariantError";

const productdbService = new ProductdbService();
const productEthService = new ProductEthService();

export const postCreateInitialProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;
        
        const gtin = req.params.gtin as string;
        
        const product = await productdbService.createProduct(gtin, userAddress);
        const traceEvent = await productdbService.createTraceEvent(product.productId, userAddress, "HARVESTING");

        res.status(201).json({
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

        const eventId = Number(req.params.eventId);
        if (!eventId) {
            throw new InvariantError("Invalid eventId format");
        }

        const payload = req.body;
        ProductValidator.validateInsertProductSchema(payload);
        const { signature } = payload;

        const dataHash = await productEthService.verifySignature(eventId, signature);
        const txHash = await productEthService.addTraceEvent(eventId, dataHash, signature);
        const updatedTraceEvent = await productdbService.updateTraceEvent(eventId, txHash);

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

export const postShippingTraceProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access")
        };
        const userAddress = user.address;
        
        const productId = Number(req.params.productId);
        if (!productId) {
            throw new InvariantError("Invalid productId format");
        }

        await productdbService.validateSupplyChainStep(productId, "SHIPPING");
        const traceEvent = await productdbService.createTraceEvent(productId, userAddress, "SHIPPING");

        res.status(201).json({
            status: "success",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postReceivingTraceProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access")
        };
        const userAddress = user.address;
        
        const productId = Number(req.params.productId);
        if (!productId) {
            throw new InvariantError("Invalid productId format");
        }

        await productdbService.validateSupplyChainStep(productId, "RECEIVING");
        const traceEvent = await productdbService.createTraceEvent(productId, userAddress, "RECEIVING");

        res.status(201).json({
            status: "success",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getVerifyTraceEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventId = Number(req.params.eventId);
        if (!eventId) {
            throw new InvariantError("Invalid eventId format");
        }

        const dataHashDB = await productdbService.computeTraceEventHash(eventId);
        const traceEventEth = await productEthService.getTraceEventById(eventId);
        const dataHashEth = traceEventEth[3];

        let validation = true;
        if (dataHashDB !== dataHashEth) {
            validation = false
        }

        res.json({
            status: 'success',
            data: {
                validation
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getProductHistrory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const productId = Number(req.params.productId);
        if (!productId) {
            throw new InvariantError("Invalid productId format");
        }

        const productHistory = await productdbService.getProductHistory(productId);

        res.json({
            status: "success",
            data: {
                productHistory
            }
        });
    } catch (error) {
        next(error)
    }
}