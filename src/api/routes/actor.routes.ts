import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/actor.handler";

const router = Router();

router.post('/', authenticateUser, authorizeUser(["ADMIN"]), handler.postRegisterActorHandler);
router.get('/', authenticateUser, authorizeUser(["ADMIN"]), handler.getListActorsHandler);
router.get('/:blockchainAddress', authenticateUser, authorizeUser(["ADMIN"]), handler.getActorByBlockchainAddressHandler);

export default router;