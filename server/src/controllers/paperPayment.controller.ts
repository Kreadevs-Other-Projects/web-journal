import { Response } from "express";
import {
  createPaperPaymentService,
  payPaperPaymentService,
} from "../services/paperPayment.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const createPaperPayment = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");

    const paperId = req.params.paperId;

    const payment = await createPaperPaymentService(req.user, paperId);

    res.status(201).json({
      success: true,
      payment,
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};

export const payPaperPayment = async (req: AuthUser, res: Response) => {
  try {
    if (!req.user) throw new Error("Unauthorized");

    const paymentId = req.params.paymentId;
    const { transaction_ref } = req.body;

    const payment = await payPaperPaymentService(
      req.user,
      paymentId,
      transaction_ref,
    );

    res.json({
      success: true,
      message: "Payment successful",
      payment,
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};
