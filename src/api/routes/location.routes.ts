import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/location.handler"

const router = Router()

router.get("/", authenticateUser, handler.getListLocationsHandler);
router.post("/", authenticateUser, authorizeUser(["ADMIN"]), handler.postCreateLocationHandler);
router.get('/:gln', authenticateUser, authorizeUser(["ADMIN"]), handler.getLocationByGlnHandler);
router.put('/:gln', authenticateUser, authorizeUser(["ADMIN"]), handler.putEditLocationByGlnHandler);

export default router;