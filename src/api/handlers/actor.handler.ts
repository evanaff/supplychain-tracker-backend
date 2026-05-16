import { type Request, type Response, type NextFunction } from "express";

import ActordbService from "../../services/database/ActorService";
import LocationService from "../../services/database/LocationService";
import ActorValidator from "../../validator/actor";
import { db } from "../../lib/db";

const actordbService = new ActordbService();
const locationService = new LocationService();

export const postAddActorHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate Payload
        const payload = req.body;
        ActorValidator.validateActorPayload(payload);
        const { blockchainAddress, role, actorName, location } = payload;
        const { locationName, address } = location;

        // Add Actor and Location
        const gln = await locationService.generateGln();
        let actor
        await db.transaction(async (tx) => {
            await locationService.addLocation(gln, locationName, address, role, tx);
            actor = await actordbService.addActor(blockchainAddress, gln, role, actorName, tx);
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

export const getAllActorsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const actors = await actordbService.getAllActors();

        res.json({
            status: 'success',
            data: {
                actors
            }
        })
    } catch (error) {
        next(error);
    }
}