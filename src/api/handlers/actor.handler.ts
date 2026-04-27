import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/postgres/ActorService";
import LocationService from "../../services/postgres/LocationService";
import ActorValidator from "../../validator/actor";
import { db } from "../../lib/db";

const actorService = new ActorService();
const locationService = new LocationService();

export const postAddActorHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate Payload
        const payload = req.body;
        ActorValidator.validateActorPayload(payload);
        const { blockchainAddress, role, actorName, location } = payload;
        const { locationName, address } = location;

        // Add Actor and Location
        let actor
        await db.transaction(async (tx) => {
            const location = await locationService.addLocation(locationName, address, role, tx);
            actor = await actorService.addActor(blockchainAddress, location.gln, role, actorName, tx);      
        })

        res.status(201).json({
            status: 'success',
            data: {
                actor
            }
        })
    } catch (error) {
        next(error);
    }
}

export const getAllActors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const actors = await actorService.getAllActors();

        res.json({
            message: 'success',
            data: {
                actors
            }
        })
    } catch (error) {
        next(error);
    }
}