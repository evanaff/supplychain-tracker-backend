import { Router } from "express";
import * as handler from "../handlers/auth.handler";

const router = Router();

router.get('/nonce', handler.getGenerateNonceHandler);
router.post('/message', handler.postSiweMessageHandler);
router.post('/verify', handler.postVerifySignatureHandler);

export default router;