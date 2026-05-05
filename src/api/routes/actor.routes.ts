import { Router } from "express";
import * as handler from "../handlers/actor.handler";
import { authenticateUser, authorizeUser } from "../../lib/middleware";

const router = Router();

router.post('/', authenticateUser, authorizeUser("ADMIN"), handler.postAddActorHandler);
router.get('/', authenticateUser, authorizeUser("ADMIN"), handler.getAllActorsHandler);
router.delete('/', authenticateUser, authorizeUser("ADMIN"), handler.deleteActorHandler);

export default router;