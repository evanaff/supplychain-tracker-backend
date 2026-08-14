import { Router } from 'express';
import multer from 'multer';
import { authenticateUser, authorizeUser } from '../../middleware';
import * as handler from "../handlers/product.handler";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() })

router.get("/", authenticateUser, handler.getListProductsHandler);
router.post("/", upload.single("image"), authenticateUser, authorizeUser(["ADMIN"]), handler.postCreateProductHandler);

export default router;