import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/product-event.handler";

const router = Router();

router.post("/", authenticateUser, handler.postCreateProductEventHandler);
router.get("/:id/hash", authenticateUser, handler.getEventHashHandler);
router.post("/:id/save-txhash", authenticateUser, handler.postSaveTxHashHandler);

export default router;