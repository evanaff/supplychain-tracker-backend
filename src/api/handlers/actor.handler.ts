import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/database/ActorService";
import ActorValidator from "../../validator/actor";
import { ListActorsQueryDTO } from "../../common/dto";

const actorService = new ActorService();

export const postCreateActorHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate Payload
        const payload = req.body;
        ActorValidator.validateCreateActorPayload(payload);

        // Add Actor
        const actor = await actorService.createActor(payload);

        res.status(201).json({
            status: "success",
            data: {
                actor
            }
        })
    } catch (error) {
        next(error);
    }
}

export const getListActorsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Query
        const query: ListActorsQueryDTO = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            role: req.query.role as | "GROWER" | "DISTRIBUTOR" | "RETAILER" | undefined,
            search: req.query.search as string | undefined
        };

        // List Actors
        const actors = await actorService.listActors(query);

        res.json({
            status: "success",
            data: {
                actors
            }
        })
    } catch (error) {
        next(error);
    }
}

export const getActorByBlockchainAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const blockchainAddress = req.params.blockchainAddress as string;

        // Get Actor
        const actor = await actorService.getActorByBlockchainAddress(blockchainAddress);

        res.json({
            status: "success",
            data: {
                actor
            }
        });
    } catch (error) {
        next(error);
    }
}

export const putEditActorByBlockchainAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const blockchainAddress = req.params.blockchainAddress as string;

        // Validate Payload
        const payload = req.body;
        ActorValidator.validateEditActorPayload(payload);

        // Edit Actor
        await actorService.editActorByBlockchainAddress(blockchainAddress, payload);

        res.json({
            status: "success",
            message: "Actor updated successfully"
        });
    } catch (error) {
        next(error);
    }
}