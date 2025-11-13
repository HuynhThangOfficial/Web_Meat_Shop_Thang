// routes/paymentLogRoutes.js
import express from "express";
import {
  createPaymentLog,
  getAllPaymentLogs,
  getPaymentLogById,
  updatePaymentStatus,
  deletePaymentLog,
} from "../controllers/paymentLogController.js";

const router = express.Router();

/*
  Đây là các route API của Payment Log
  Mỗi route gọi 1 controller tương ứng.
*/

router.post("/", createPaymentLog); // POST /api/paymentLogs
router.get("/", getAllPaymentLogs); // GET /api/paymentLogs
router.get("/:id", getPaymentLogById); // GET /api/paymentLogs/:id
router.put("/:id", updatePaymentStatus); // PUT /api/paymentLogs/:id
router.delete("/:id", deletePaymentLog); // DELETE /api/paymentLogs/:id

export default router;
