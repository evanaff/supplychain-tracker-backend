import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/trace.handler";

const router = Router();

// Trace Products
router.post("/trace-products", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateTraceProductHandler);
router.get("/trace-products", authenticateUser, handler.getListTraceProductsHandler);
router.get("/trace-products/:id", authenticateUser, handler.getTraceProductByIdHandler);
router.get("/trace-products/:id/history", handler.getTraceProductHistoryHandler);
router.post("/trace-products/:id/verify", handler.postVerifyTraceProductHandler);

// Trace Events
router.post("/trace-events/harvesting", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateHarvestingEventHandler);
router.post("/trace-events/shipping", authenticateUser, authorizeUser(["GROWER", "DISTRIBUTOR"]), handler.postCreateShippingEventHandler);
router.post("/trace-events/receiving", authenticateUser, authorizeUser(["DISTRIBUTOR", "RETAILER"]), handler.postCreateReceivingEventHandler);
router.post("/trace-events/selling", authenticateUser, authorizeUser(["RETAILER"]), handler.postCreateSellingEventHandler);
router.get("/trace-events/:id", authenticateUser, handler.getTraceEventByIdHandler);
router.get("/trace-events/:id/message-hash", authenticateUser, handler.getGenerateMessageHash)
// router.post("/trace-events/:id/submit", authenticateUser, handler.postSubmitTraceEvent);

// Dashboard
router.get("/dashboard/admin", authenticateUser, authorizeUser(["ADMIN"]), handler.getAdminDashboardHandler);

export default router;