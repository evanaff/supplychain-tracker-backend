import { type Request, type Response, type NextFunction } from "express";

import TracedbService from "../../services/database/TracedbService";
import TraceEthService from "../../services/blockchain/TraceEthService";
import TraceValidator from "../../validator/trace";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import InvariantError from "../../common/exceptions/InvariantError";
import { ListTraceProductsQueryDTO } from "../../types/dataTransferObject";
import { SupplyChainActivity } from "../../types/types";

const tracedbService = new TracedbService();
const traceEthService = new TraceEthService();

// --------------------------
// Trace Product Handlers
// --------------------------

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
        TraceValidator.validateCreateTraceProductPayloadSchema(payload);

        // Create Trace Product
        const traceProduct = await tracedbService.createTraceProduct(userAddress, payload);

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
        const { traceProducts, pagination } = await tracedbService.listTraceProducts(userAddress, userRole, query);

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
        const traceProduct = await tracedbService.getTraceProductById(id);

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
        const traceProduct = await tracedbService.getTraceProductById(traceProductId);
        const traceEvents = await tracedbService.getTraceEventsByTraceProductId(traceProductId);

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

// -----------------------
// Trace Event Handlers
// -----------------------

export const postCreateHarvestingEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        // Validate Payload
        const payload = req.body;
        TraceValidator.validateCreateGeneralEventPayloadSchema(payload);

        // Create Harvesting Event
        await tracedbService.validateTraceEventSequence(userAddress, payload, "HARVESTING");
        const traceEvent = await tracedbService.createTraceEvent(userAddress, payload, "HARVESTING");

        res.status(201).json({
            status: "success",
            message: "Trace event created successfully",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postCreateShippingEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        const payload = req.body;
        TraceValidator.validateCreateShippingEventPayloadSchema(payload);

        // Create Shipping Event
        await tracedbService.validateTraceEventSequence(userAddress, payload, "SHIPPING");
        const traceEvent = await tracedbService.createTraceEvent(userAddress, payload, "SHIPPING");

        res.status(201).json({
            status: "success",
            message: "Trace event created successfully",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postCreateReceivingEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        const payload = req.body;
        TraceValidator.validateCreateGeneralEventPayloadSchema(payload);

        // Create Shipping Event
        await tracedbService.validateTraceEventSequence(userAddress, payload, "RECEIVING");
        const traceEvent = await tracedbService.createTraceEvent(userAddress, payload, "RECEIVING");

        res.status(201).json({
            status: "success",
            message: "Trace event created successfully",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postCreateSellingEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        // Validate Payload
        const payload = req.body;
        TraceValidator.validateCreateGeneralEventPayloadSchema(payload);

        // Create Selling Event
        await tracedbService.validateTraceEventSequence(userAddress, payload, "SELLING");
        const traceEvent = await tracedbService.createTraceEvent(userAddress, payload, "SELLING");

        res.status(201).json({
            status: "success",
            message: "Trace event created successfully",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getGenerateMessageHash = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceEventId = req.params.id as string;

        // Generate Message Hash
        const dataHash = await tracedbService.generateDataHash(traceEventId);
        const messageHash = await tracedbService.generateMessageHash(traceEventId, dataHash);

        res.json({
            status: "success",
            data: {
                messageHash
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postSubmitTraceEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceEventId = req.params.id as string;
        
        // Validate Payload
        const payload = req.body;
        TraceValidator.validateSubmitTraceEventPayloadSchema(payload);
        
        const dataHash = await tracedbService.generateDataHash(traceEventId);
        const messageHash = await tracedbService.generateMessageHash(traceEventId, dataHash);
        await traceEthService.verifySignature(traceEventId, messageHash, payload);
        
        const txHash = await traceEthService.addTraceEventToBlockchain(traceEventId, dataHash, payload);
        const traceEvent = await tracedbService.updateTraceEvent(traceEventId, txHash);

        res.status(201).json({
            status: "success",
            message: "Trace event submitted to blockchain successfully",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getTraceEventByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const id = req.params.id as string;
        if (!id) {
            throw new InvariantError("Trace product id is required")
        }

        // Get Trace Event Data
        const traceEvent = await tracedbService.getTraceEventById(id);

        res.json({
            status: "success",
            data: {
                traceEvent
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postVerifyTraceEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceEventId = req.params.id as string;

        const dataHashDB = await tracedbService.generateDataHash(traceEventId);
        const traceEventEth = await traceEthService.getTraceEventById(traceEventId);
        const dataHashEth = traceEventEth[3];

        let validation = true;
        if (dataHashDB !== dataHashEth) {
            validation = false
        }

        res.json({
            status: 'success',
            message: "Trace event validated successfully",
            data: {
                validation
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
        
        const traceEvents = await tracedbService.getTraceEventsByTraceProductId(traceProductId);

        let validEvents = [];
        let invalidEvents = [];
        let missingEvents = [];
        
        for (const traceEvent of traceEvents) {
            
            const dataHashDB = await tracedbService.generateDataHash(traceEvent.id);
            const traceEventEth = await traceEthService.getTraceEventById(traceEvent.id);
            const dataHashEth = traceEventEth[3];

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

// -----------------------
// Dashboard Handlers
// -----------------------

export const getAdminDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Dashboard Data
        const totalGrowers = await tracedbService.countGrower();
        const totalDistributors = await tracedbService.countDistributor();
        const totalRetailers = await tracedbService.countRetailer();
        const totalLocations = await tracedbService.countLocation();

        res.json({
            status: "success",
            data: {
                totalGrowers,
                totalDistributors,
                totalRetailers,
                totalLocations
            }
        });
    } catch (error) {
        next(error);
    }
}