import { Router } from 'express';
import { authenticateUser } from '../../middleware';
import * as handler from "../handlers/product.handler"

const router = Router();

router.get("/", authenticateUser, handler.getListProducts)

export default router;