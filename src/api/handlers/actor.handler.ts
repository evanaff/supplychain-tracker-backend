import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/ActorService";
import ActorValidator from "../../validator/actor";
import { ListActorsQueryDTO } from "../../types/dataTransferObject";
import { Role } from "../../types/types";

const actorService = new ActorService();

export const postRegisterActorHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate Payload
        const payload = req.body;
        ActorValidator.validateCreateActorPayload(payload);

        // Add Actor
        const actor = await actorService.registerActorToDatabase(payload);
        const txHash = await actorService.registerActorToBlockchain(payload.blockchainAddress);

        res.status(201).json({
            status: "success",
            message: "Actor registered successfully",
            data: {
                actor,
                txHash
            }
        });
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
            filter: req.query.filter as Role | undefined,
            search: req.query.search as string | undefined
        };

        // List Actors
        const { actors, pagination } = await actorService.listActors(query);

        res.json({
            status: "success",
            data: {
                actors,
                pagination
            }
        })
    } catch (error) {
        next(error);
    }
}