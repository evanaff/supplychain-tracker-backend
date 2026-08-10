import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/ActorService";
import ActorValidator from "../../validator/actor";
import { ListActorsQueryDTO } from "../../types/dataTransferObject";
import { Role } from "../../types/types";

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
            message: "Actor created successfully",
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
            filter: req.query.filter as Role | undefined,
            search: req.query.search as string | undefined
        };

        // List Actors
        const { actors, pagination } = await actorService.listActors(query);

        console.log(actors);

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