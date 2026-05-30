import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/trace.handler";

const router = Router();

// Trace Products
router.post("/trace-products", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateTraceProductHandler);
router.get("/trace-products", authenticateUser, handler.getListTraceProductsHandler);
router.get("/trace-products/:id/history", handler.getTraceProductHistoryHandler);

// Trace Events
router.post("/trace-events/harvesting", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateHarvestingEventHandler);
router.post("/trace-events/shipping", authenticateUser, authorizeUser(["GROWER", "DISTRIBUTOR"]), handler.postCreateShippingEventHandler);
router.post("/trace-events/receiving", authenticateUser, authorizeUser(["DISTRIBUTOR", "RETAILER"]), handler.postCreateReceivingEventHandler);
router.post("/trace-events/selling", authenticateUser, authorizeUser(["RETAILER"]), handler.postCreateSellingEventHandler);
router.post("/trace-events/:id/submit", authenticateUser, handler.postSubmitTraceEvent);
router.post("/trace-events/:id/verify", authenticateUser, handler.postVerifyTraceEventHandler);

// Dashboard
router.get("/dashboard/admin", authenticateUser, authorizeUser(["ADMIN"]), handler.getAdminDashboardHandler);
router.get("/dashboard/grower", authenticateUser, authorizeUser(["GROWER"]), handler.getGrowerDashboardHandler);
router.get("/dashboard/distributor", authenticateUser, authorizeUser(["DISTRIBUTOR"]), handler.getDistributorDashboardHandler);
router.get("/dashboard/retailer", authenticateUser, authorizeUser(["RETAILER"]), handler.getRetailerDashboardHandler);

export default router;