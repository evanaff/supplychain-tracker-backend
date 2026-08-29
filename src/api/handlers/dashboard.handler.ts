import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/ActorService";
import LocationService from "../../services/LocationService";
import ProductService from "../../services/ProductService";
import ProductLotService from "../../services/ProductLotService";

const actorService = new ActorService();
const locationService = new LocationService();
const productService = new ProductService();
const productLotService = new ProductLotService();

export const getAdminDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Dashboard Data
        const totalGrowers = await actorService.countGrower();
        const totalDistributors = await actorService.countDistributor();
        const totalRetailers = await actorService.countRetailer();
        const totalLocations = await locationService.countLocation();
        const totalProducts = await productService.countProduct();
        const totalProductLots = await productLotService.countProductLot();

        res.json({
            status: "success",
            data: {
                totalGrowers,
                totalDistributors,
                totalRetailers,
                totalLocations,
                totalProducts,
                totalProductLots
            }
        });
    } catch (error) {
        next(error);
    }
}