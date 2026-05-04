import { Router } from "express";
import * as handler from "../handlers/product.handler";
import { authenticateUser, onlyGrower } from "../../lib/middleware";

const router = Router();

router.post('/initial', authenticateUser, onlyGrower, handler.postCreateInitialProduct);
router.post('/trace', authenticateUser, onlyGrower, handler.postAddBlockchainTraceEvent);

export default router;