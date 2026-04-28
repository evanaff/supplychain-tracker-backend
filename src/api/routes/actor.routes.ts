import { Router } from "express";
import * as handler from "../handlers/actor.handler";
import { authenticateUser, verifyAdmin } from "../../lib/middleware";

const router = Router();

router.post('/', authenticateUser, verifyAdmin, handler.postAddActorHandler);
router.get('/', authenticateUser, verifyAdmin, handler.getAllActorsHandler);
router.delete('/', authenticateUser, verifyAdmin, handler.deleteActorHandler);

export default router;