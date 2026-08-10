import { Router } from "express";
import { authenticateUser, authorizeUser } from "../../middleware";
import * as handler from "../handlers/dashboard.handler";

const router = Router();

// Dashboard
router.get("/", authenticateUser, authorizeUser(["ADMIN"]), handler.getAdminDashboardHandler);

export default router;