import { Router } from "express";
import * as handler from "../handlers/trace.handler";
import { authenticateUser, authorizeUser } from "../../middleware";

const router = Router();

router.post("/products/:gtin/initial", authenticateUser, authorizeUser("GROWER"), handler.postCreateInitialTraceProduct);

router.get("/products", authenticateUser, handler.getGrowerTraceProducts);
router.get("/products/search", authenticateUser, handler.getSearchTraceProduct);
router.get("/products/:traceProductId/last-event", authenticateUser, handler.getLastTraceEvent);

router.post("/events/:eventId/blockchain", authenticateUser, handler.postAddBlockchainTraceEvent);

router.post("/products/:traceProductId/shipping", authenticateUser, handler.postShippingTraceProduct);
router.post("/products/:traceProductId/receiving", authenticateUser, authorizeUser("DISTRIBUTOR", "RETAILER"), handler.postReceivingTraceProduct);

router.get("/events/:eventId/verify", handler.getVerifyTraceEvent);
router.get("/products/:traceProductId/history", handler.getTraceProductHistrory);

export default router;