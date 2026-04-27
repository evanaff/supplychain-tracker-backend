import { Router } from "express";
import * as handler from "../handlers/actor.handler";
import { authenticateUser, verifyAdmin } from "../../lib/middleware";

const router = Router();

router.post('/', authenticateUser, verifyAdmin, handler.postAddActorHandler);
router.get('/', authenticateUser, verifyAdmin, handler.getAllActors);

export default router;