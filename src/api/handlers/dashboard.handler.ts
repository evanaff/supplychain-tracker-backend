import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/ActorService";
import LocationService from "../../services/LocationService";

const actorService = new ActorService();
const locationService = new LocationService();

export const getAdminDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Dashboard Data
        const totalGrowers = await actorService.countGrower();
        const totalDistributors = await actorService.countDistributor();
        const totalRetailers = await actorService.countRetailer();
        const totalLocations = await locationService.countLocation();

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