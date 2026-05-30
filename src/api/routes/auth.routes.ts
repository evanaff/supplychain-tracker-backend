import { Router } from "express";
import * as handler from "../handlers/auth.handler";

const router = Router();

// Login
router.get('/nonce', handler.getGenerateNonceHandler);
router.post('/message', handler.postSiweMessageHandler);
router.post('/verify', handler.postVerifySignatureHandler);

// Refrest Token
router.post('/refresh', handler.postRefreshTokenHandler);

// Logout
router.post('/logout', handler.deleteRefreshTokenHandler);

export default router;