import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/location.handler"

const router = Router()

router.get("/", authenticateUser, handler.getListLocationsHandler);
router.post("/", authenticateUser, authorizeUser(["ADMIN"]), handler.postCreateLocationHandler);

export default router;