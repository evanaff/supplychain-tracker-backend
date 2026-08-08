import { Router } from "express";
import * as handler from "../handlers/auth.handler";

const router = Router();

// Login
router.post('/message', handler.postGenerateMessageHandler);
router.post('/verify', handler.postVerifySignatureHandler);

// Refrest Token
router.post('/refresh', handler.postRefreshTokenHandler);

// Logout
router.post('/logout', handler.deleteRefreshTokenHandler);

export default router;