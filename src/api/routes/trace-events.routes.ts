import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/trace-event.handler";

const router = Router();

// Trace Events
router.post("/harvesting", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateHarvestingEventHandler);
router.post("/shipping", authenticateUser, authorizeUser(["GROWER", "DISTRIBUTOR"]), handler.postCreateShippingEventHandler);
router.post("/receiving", authenticateUser, authorizeUser(["DISTRIBUTOR", "RETAILER"]), handler.postCreateReceivingEventHandler);
router.post("/selling", authenticateUser, authorizeUser(["RETAILER"]), handler.postCreateSellingEventHandler);
router.get("/:id", authenticateUser, handler.getTraceEventByIdHandler);
router.get("/:id/message-hash", authenticateUser, handler.getGenerateMessageHash)

export default router;