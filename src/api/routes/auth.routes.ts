import { Router } from "express";
import * as handler from "../handlers/auth.handler";
import { authenticateUser } from "../../middleware";

const router = Router();

// Login
router.post('/message', handler.postGenerateMessageHandler);
router.post('/verify', handler.postVerifySignatureHandler);
router.get('/me', authenticateUser, handler.getCurrentActorHandler);

// Refresh Token
router.post('/refresh', handler.postRefreshTokenHandler);

// Logout
router.post('/logout', handler.deleteRefreshTokenHandler);

export default router;