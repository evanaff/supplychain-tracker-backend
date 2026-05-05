import { Router } from "express";
import * as handler from "../handlers/product.handler";
import { authenticateUser, authorizeUser } from "../../lib/middleware";

const router = Router();

router.post("/:gtin/initial", authenticateUser, authorizeUser("GROWER"), handler.postCreateInitialProduct);
router.post("/trace-event/:eventId/blockchain", authenticateUser, authorizeUser("GROWER"), handler.postAddBlockchainTraceEvent);

router.post("/:productId/shipping", authenticateUser, handler.postShippingTraceProduct);
router.post("/:productId/receiving", authenticateUser, authorizeUser("DISTRIBUTOR", "RETAILER"), handler.postReceivingTraceProduct);

router.get("/trace-event/:eventId/verify", handler.getVerifyTraceEvent);
router.get("/:productId/history", handler.getProductHistrory);

export default router;