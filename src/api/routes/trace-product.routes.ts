import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/trace-product.handler";

const router = Router();

router.post("/", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateTraceProductHandler);
router.get("/", authenticateUser, handler.getListTraceProductsHandler);
router.get("/:id", authenticateUser, handler.getTraceProductByIdHandler);
router.get("/:id/history", handler.getTraceProductHistoryHandler);
router.post("/:id/verify", handler.postVerifyTraceProductHandler);

export default router;