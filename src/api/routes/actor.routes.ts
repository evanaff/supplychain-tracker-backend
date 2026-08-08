import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/actor.handler";

const router = Router();

router.post('/', authenticateUser, authorizeUser(["ADMIN"]), handler.postCreateActorHandler);
router.get('/', authenticateUser, authorizeUser(["ADMIN"]), handler.getListActorsHandler);
router.get('/:blockchainAddress', authenticateUser, authorizeUser(["ADMIN"]), handler.getActorByBlockchainAddress);

export default router;