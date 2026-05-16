import { Router } from 'express';
import * as handler from "../handlers/product.handler"
import multer from 'multer';

import { authenticateUser, authorizeUser } from '../../middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() })

router.post("/", upload.single("image"), authenticateUser, authorizeUser("ADMIN"), handler.postCreateProduct)
router.get("/", authenticateUser, handler.getAllProducts);
router.get("/search", authenticateUser, handler.getSearchProduct);

export default router;