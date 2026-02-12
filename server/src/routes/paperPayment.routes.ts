import { Router } from "express";

import {
  createPaperPayment,
  payPaperPayment,
} from "../controllers/paperPayment.controller";

import { payPaperPaymentSchema } from "../schemas/paperPayment.schema";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.post(
  "/createPaperPayment/:paperId",
  authMiddleware,
  authorize("author"),
  createPaperPayment,
);

router.post(
  "/payPaperPayment/:paymentId",
  authMiddleware,
  authorize("author"),
  validate(payPaperPaymentSchema),
  payPaperPayment,
);

export default router;
