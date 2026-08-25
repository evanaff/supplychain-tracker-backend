import { type Request, type Response, type NextFunction } from "express";

import ActorService from "../../services/ActorService";
import LocationService from "../../services/LocationService";
import ProductService from "../../services/ProductService";
import TraceProductService from "../../services/TraceProductService";

const actorService = new ActorService();
const locationService = new LocationService();
const productService = new ProductService();
const traceProductService = new TraceProductService();

export const getAdminDashboardHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Dashboard Data
        const totalGrowers = await actorService.countGrower();
        const totalDistributors = await actorService.countDistributor();
        const totalRetailers = await actorService.countRetailer();
        const totalLocations = await locationService.countLocation();
        const totalProducts = await productService.countProduct();
        const totalTraceProducts = await traceProductService.countTraceProduct();

        res.json({
            status: "success",
            data: {
                totalGrowers,
                totalDistributors,
                totalRetailers,
                totalLocations,
                totalProducts,
                totalTraceProducts
            }
        });
    } catch (error) {
        next(error);
    }
}