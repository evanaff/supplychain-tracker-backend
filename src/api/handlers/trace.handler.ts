import { type Request, type Response, type NextFunction } from "express";

import AuthorizationError from "../../common/exceptions/AuthorizationError";
import TracedbService from "../../services/database/TracedbService";
import TraceEthService from "../../services/blockchain/TraceEthService";
import ProductValidator from "../../validator/trace";
import InvariantError from "../../common/exceptions/InvariantError";

const tracedbService = new TracedbService();
const traceEthService = new TraceEthService();

export const postCreateInitialTraceProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;
        
        const gtin = req.params.gtin as string;
        
        const traceProduct = await tracedbService.createTraceProduct(gtin, userAddress);
        const traceEvent = await tracedbService.createTraceEvent(traceProduct.id, userAddress, "HARVESTING");

        res.status(201).json({
            status: 'success',
            data: {
                traceProduct,
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

        const dataHash = await traceEthService.verifySignature(eventId, signature);
        const txHash = await traceEthService.addTraceEvent(eventId, dataHash, signature);
        const updatedTraceEvent = await tracedbService.updateTraceEvent(eventId, txHash);

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

export const getGrowerTraceProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access")
        };
        const userAddress = user.address;

        const traceProducts = await tracedbService.getTraceProductsByAddress(userAddress);

        res.json({
            status: "success",
            data: {
                traceProducts
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getSearchTraceProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access")
        };
        const userAddress = user.address;
        const keyword = req.query.keyword as string;

        const traceProducts = await tracedbService.searchTraceProducts(userAddress, keyword);

        res.json({
            status: "success",
            data: {
                traceProducts
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getLastTraceEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const traceProductId = parseInt(req.params.traceProductId as string);

        const lastTraceEvent = await tracedbService.getLastTraceEventByTraceProductId(traceProductId);

        res.json({
            status: "success",
            data: {
                lastTraceEvent
            }
        });
    } catch (error) {
        next(error)
    }
}

export const postShippingTraceProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access")
        };
        const userAddress = user.address;
        
        const traceProductId = Number(req.params.traceProductId);
        if (!traceProductId) {
            throw new InvariantError("Invalid traceProductId format");
        }

        await tracedbService.validateSupplyChainStep(traceProductId, "SHIPPING");
        const traceEvent = await tracedbService.createTraceEvent(traceProductId, userAddress, "SHIPPING");

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
        
        const traceProductId = Number(req.params.traceProductId);
        if (!traceProductId) {
            throw new InvariantError("Invalid traceProductId format");
        }

        await tracedbService.validateSupplyChainStep(traceProductId, "RECEIVING");
        const traceEvent = await tracedbService.createTraceEvent(traceProductId, userAddress, "RECEIVING");

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

        const dataHashDB = await tracedbService.computeTraceEventHash(eventId);
        const traceEventEth = await traceEthService.getTraceEventById(eventId);
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

export const getTraceProductHistrory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const traceProductId = Number(req.params.traceProductId);
        if (!traceProductId) {
            throw new InvariantError("Invalid traceProductId format");
        }

        const {traceProductRecord: traceProduct, productRecord: product, traceEventRecords: traceEvents} = await tracedbService.getTraceProductHistory(traceProductId);

        res.json({
            status: "success",
            data: {
                traceProduct,
                product,
                traceEvents
            }
        });
    } catch (error) {
        next(error)
    }
}