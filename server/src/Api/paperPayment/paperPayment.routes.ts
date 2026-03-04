import { Router } from "express";

import { createPaperPayment, payPaperPayment } from "./paperPayment.controller";

import { payPaperPaymentSchema } from "./paperPayment.schema";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.post(
  "/createPaperPayment",
  authMiddleware,
  authorize("publisher"),
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
