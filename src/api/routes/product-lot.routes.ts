import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/product-lot.handler";

const router = Router();

router.post("/", authenticateUser, authorizeUser(["GROWER"]), handler.postCreateProductLotHandler);
router.get("/", authenticateUser, handler.getListProductLotsHandler);
router.get("/:id", handler.getProductLotHistoryHandler);
router.post("/:id/verify", handler.postVerifyProductLotHandler);

export default router;