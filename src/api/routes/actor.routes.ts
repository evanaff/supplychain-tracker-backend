import { Router } from "express";
import * as handler from "../handlers/actor.handler";
import { authenticateUser, authorizeUser } from "../../middleware";

const router = Router();

router.post('/', authenticateUser, authorizeUser("ADMIN"), handler.postAddActorHandler);
router.get('/', authenticateUser, authorizeUser("ADMIN"), handler.getAllActorsHandler);

export default router;