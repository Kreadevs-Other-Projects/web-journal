import { Response } from "express";
// import {
//   createPaperPaymentService,
//   payPaperPaymentService,
// } from "./paperPayment.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const createPaperPayment = async (req: AuthUser, res: Response) => {
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
  // try {
  //   if (!req.user) throw new Error("Unauthorized");

  //   const { paperId, pricePerPage } = req.body;

  //   if (!pricePerPage || pricePerPage <= 0) {
  //     throw new Error("Invalid payment amount");
  //   }

  //   const payment = await createPaperPaymentService(
  //     req.user,
  //     paperId,
  //     pricePerPage,
  //   );

  //   res.status(201).json({
  //     success: true,
  //     payment,
  //   });
  // } catch (e: any) {
  //   res.status(400).json({
  //     success: false,
  //     message: e.message,
  //   });
  // }
};

export const payPaperPayment = async (req: AuthUser, res: Response) => {
  // PAYMENT_DISABLED: Temporarily disabled per client instruction (Mar 2026)
  return res
    .status(503)
    .json({ message: "Payment flow is currently disabled." });
  // try {
  //   if (!req.user) throw new Error("Unauthorized");

  //   const paymentId = req.params.paymentId;
  //   const { transaction_ref } = req.body;

  //   const payment = await payPaperPaymentService(
  //     req.user,
  //     paymentId,
  //     transaction_ref,
  //   );

  //   res.json({
  //     success: true,
  //     message: "Payment successful",
  //     payment,
  //   });
  // } catch (e: any) {
  //   res.status(400).json({
  //     success: false,
  //     message: e.message,
  //   });
  // }
};
