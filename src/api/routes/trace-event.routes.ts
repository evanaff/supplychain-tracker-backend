import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/trace-event.handler";

const router = Router();

// Trace Events
router.post("/", authenticateUser, handler.postCreateTraceEventHandler);
router.get("/:id", authenticateUser, handler.getTraceEventByIdHandler);
router.get("/:id/hash", authenticateUser, handler.getEventHashHandler);
router.post("/:id/save-txhash", authenticateUser, handler.postSaveTxHashHandler);

export default router;