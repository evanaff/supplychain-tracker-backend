import { Router } from "express";
import * as handler from "../handlers/product.handler";
import { authenticateUser, onlyGrower } from "../../lib/middleware";

const router = Router();

router.post('/initial', authenticateUser, onlyGrower, handler.postCreateInitialProduct);
router.post('/trace', authenticateUser, onlyGrower, handler.postAddBlockchainTraceEvent);

router.post('/shipping', authenticateUser, handler.postShippingTraceProduct);
router.post('/receiving', authenticateUser, handler.postReceivingTraceProduct);

export default router;