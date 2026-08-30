import { type Request, type Response, type NextFunction } from "express";

import ProductLotService from "../../services/ProductLotService";
import ProductEventService from "../../services/ProductEventService";
import ProductLotValidator from "../../validator/product-lot";
import AuthorizationError from "../../common/exceptions/AuthorizationError";
import InvariantError from "../../common/exceptions/InvariantError";
import { ListProductLotsQueryDTO } from "../../types/dataTransferObject";
import { SupplyChainActivity } from "../../types/types";

const productLotService = new ProductLotService();
const productEventService = new ProductEventService();

export const postCreateProductLotHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get User Address
        const user = req.user;
        if (!user) {
            throw new AuthorizationError("Unauthorized access");
        }
        const userAddress = user.address;

        // Validate Payload
        const payload = req.body;
        ProductLotValidator.validateCreateProductLotPayloadSchema(payload);

        // Create Product Lot
        const productLot = await productLotService.createProductLot(userAddress, payload);

        res.status(201).json({
            status: "success",
            message: "Product lot created successfully",
            data: {
                productLot
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getListProductLotsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Query
        const query: ListProductLotsQueryDTO = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search as string | undefined,
            filter: req.query.filter as SupplyChainActivity | undefined
        };

        // List Product Lots
        const { productLots, pagination } = await productLotService.listProductLots(query);

        res.json({
            status: "success",
            data: {
                productLots,
                pagination
            }
        });
    } catch (error) {
        next(error);
    }
}

export const getProductLotHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const productLotId = req.params.id as string;
        if (!productLotId) {
            throw new InvariantError("Id is required")
        }

        // Get Product Lot History
        const productLot = await productLotService.getProductLotById(productLotId);
        const productEvents = await productEventService.getProductEventsByProductLotId(productLotId);

        res.json({
            status: "success",
            data: {
                productLot,
                productEvents
            }
        });
    } catch (error) {
        next(error);
    }
}

export const postVerifyProductHistoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get Params
        const productLotId = req.params.id as string;

        const productEventsDB = await productEventService.getProductEventsByProductLotId(productLotId);
        const productEventIdsETH = await productLotService.getProductEventIdsByProductLotIdFromBlockchain(productLotId);

        let validEvents = [];
        let invalidEvents = [];
        let unrecordedEvents = [];
        let missingEvents = [];
        
        for (const productEvent of productEventsDB) {
            const existInBlockchain = productEventIdsETH.includes(productEvent.id);
            if (!existInBlockchain) {
                unrecordedEvents.push(productEvent.id);
                continue;
            }
            
            const productEventETH = await productEventService.getProductEventByIdFromBlockchain(productEvent.id);
            const dataHashDB = await productEventService.generateDataHash(productEvent.id);
            const dataHashETH = productEventETH.dataHash;

            if (dataHashDB === dataHashETH) {
                validEvents.push(productEvent.id);
            } else {
                invalidEvents.push(productEvent.id);
            }
        }

        for (const productEventId of productEventIdsETH) {
            const existInDatabase = productEventsDB.some(
                (event) => event.id === productEventId
            );

            if (!existInDatabase) {
                missingEvents.push(productEventId);
            }
        }

        const totalEvents = validEvents.length + invalidEvents.length + missingEvents.length + unrecordedEvents.length;

        res.json({
            status: "success",
            data: {
                totalEvents,
                validEvents,
                invalidEvents,
                missingEvents,
                unrecordedEvents
            }
        });
    } catch (error) {
        next(error);
    }
}