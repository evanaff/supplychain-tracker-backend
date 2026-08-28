import { type Request, type Response, type NextFunction } from "express";

import TraceEventService from "../../services/TraceEventService";
import TraceEventValidator from "../../validator/trace-event";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import InvariantError from "../../common/exceptions/InvariantError";

const traceEventService = new TraceEventService();

export const getTraceEventByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const id = req.params.id as string;
        if (!id) {
            throw new InvariantError("Trace product id is required")
        }

        // Get Trace Event Data
        const traceEvent = await traceEventService.getTraceEventByIdFromDatabase(id);

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

export const postCreateTraceEventHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        // Validate Payload
        const payload = req.body;
        TraceEventValidator.validateCreateTraceEventPayloadSchema(payload);

        // Create Trace Event
        const traceEvent = await traceEventService.createTraceEvent(userAddress, payload);

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

export const getEventHashHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceEventId = req.params.id as string;

        // Generate Message Hash
        const dataHash = await traceEventService.generateDataHash(traceEventId);
        const messageHash = await traceEventService.generateMessageHash(traceEventId, dataHash);

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

export const getGenerateDataHashHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const traceEventId = req.params.id as string;

        // Generate Message Hash
        const dataHash = await traceEventService.generateDataHash(traceEventId);

        res.json({
            status: "success",
            data: {
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
        const traceEventId = req.params.id as string;

        // Validate Payload
        const payload = req.body;
        TraceEventValidator.validateSaveTxHashPayloadSchema(payload);

        // Save Tx Hash
        await traceEventService.saveTxHash(traceEventId, payload.txHash);
        
        res.json({
            status: "success",
            message: "Tx hash saved successfully"
        })
    } catch (error) {
        next(error)
    }
}