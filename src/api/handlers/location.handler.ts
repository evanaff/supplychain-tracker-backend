import { type Request, type Response, type NextFunction } from "express";

import LocationService from "../../services/LocationService";
import LocationValidator from "../../validator/location";
import { ListLocationsQueryDTO } from "../../types/dataTransferObject";
import { Role } from "../../types/types";

const locationService = new LocationService();

export const postCreateLocationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate Payload
        const payload = req.body;
        LocationValidator.validateLocationPayload(payload);

        // Create Location
        const location = await locationService.createLocation(payload);

        res.status(201).json({
            status: "success",
            message: "Location created successfully",
            data : {
                location
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getListLocationsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Query
        const query: ListLocationsQueryDTO = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            filter: req.query.filter as Role | undefined,
            search: req.query.search as string | undefined
        };

        // List Locations
        const { locations, pagination } = await locationService.listLocations(query);

        res.json({
            status: "success",
            data: {
                locations,
                pagination
            }
        })
    } catch (error) {
        next(error);
    }
}

export const getLocationByGlnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const gln = req.params.gln as string;

        // Get Location
        const location = await locationService.getLocationByGln(gln);

        res.json({
            status: "success",
            data: {
                location
            }
        });
    } catch (error) {
        next(error);
    }
}