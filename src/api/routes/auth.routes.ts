import { Router } from "express";
import * as handler from "../handlers/auth.handler";

const router = Router();

router.get('/nonce', handler.getGenerateNonce);
router.post('/verify', handler.postVerifySignature)

export default router;