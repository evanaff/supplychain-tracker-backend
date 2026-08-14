import { type Request, type Response, type NextFunction } from "express";

import TraceProductService from "../../services/TraceProductService";
import TraceEventService from "../../services/TraceEventService";
import TraceProductValidator from "../../validator/trace-product";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import InvariantError from "../../common/exceptions/InvariantError";
import { ListTraceProductsQueryDTO } from "../../types/dataTransferObject";
import { SupplyChainActivity } from "../../types/types";

const traceProductService = new TraceProductService();
const traceEventService = new TraceEventService();

export const postCreateTraceProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        // Validate Payload
        const payload = req.body;
        TraceProductValidator.validateCreateTraceProductPayloadSchema(payload);

        // Create Trace Product
        const traceProduct = await traceProductService.createTraceProduct(userAddress, payload);

        res.status(201).json({
            status: "success",
            message: "Trace product created successfully",
            data: {
                traceProduct
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getListTraceProductsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;
        const userRole = user.role;

        // Get Query
        const query: ListTraceProductsQueryDTO = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search as string | undefined,
            filter: req.query.filter as SupplyChainActivity | undefined
        };

        // List Trace Products
        const { traceProducts, pagination } = await traceProductService.listTraceProducts(userAddress, userRole, query);

        console.log(traceProducts);

        res.json({
            status: "success",
            data: {
                traceProducts,
                pagination
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getTraceProductByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const id = req.params.id as string;
        if (!id) {
            throw new InvariantError("Trace product id is required")
        }

        // Get Trace Product
        const traceProduct = await traceProductService.getTraceProductById(id);

        res.json({
            status: "success",
            data: {
                traceProduct
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getTraceProductHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceProductId = req.params.id as string;
        if (!traceProductId) {
            throw new InvariantError("Id is required")
        }

        // Get Trace Product History
        const traceProduct = await traceProductService.getTraceProductById(traceProductId);
        const traceEvents = await traceEventService.getTraceEventsByTraceProductId(traceProductId);

        res.json({
            status: "success",
            data: {
                traceProduct,
                traceEvents
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postVerifyTraceProductHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceProductId = req.params.id as string;

        
        const traceEvents = await traceEventService.getTraceEventsByTraceProductId(traceProductId);
        
        let validEvents = [];
        let invalidEvents = [];
        let missingEvents = [];
        
        for (const traceEvent of traceEvents) {
            const dataHashDB = await traceEventService.generateDataHash(traceEvent.id);
            const traceEventEth = await traceEventService.getTraceEventByIdFromBlockchain(traceEvent.id);
            const dataHashEth = traceEventEth[1];

            console.log(traceEventEth);

            if (!traceEvent.isRecorded || dataHashEth === "0x0000000000000000000000000000000000000000000000000000000000000000") {
                missingEvents.push(traceEvent.id);
                continue;
            }
            if (dataHashDB === dataHashEth) {
                validEvents.push(traceEvent.id);
                continue
            }
            invalidEvents.push(traceEvent.id);
        }

        res.json({
            status: "success",
            data: {
                totalEvents: traceEvents.length,
                validEvents,
                invalidEvents,
                missingEvents
            }
        });
    } catch (error) {
        next(error);
    }
}