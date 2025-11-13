// routes/orderRoutes.js
import express from "express";
import {
  getAllOrders,
  getOrdersByUser,
  getOrderDetail,
  createOrderFromCart,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();

//  Lấy tất cả đơn hàng (Admin)
router.get("/", getAllOrders);

//  Lấy đơn hàng của 1 user
router.get("/user/:userId", getOrdersByUser);

//  Lấy chi tiết 1 đơn
router.get("/:orderId", getOrderDetail);

//  Tạo đơn từ giỏ hàng
router.post("/", createOrderFromCart);

//  Cập nhật trạng thái đơn
router.put("/:orderId/status", updateOrderStatus);

//  Hủy đơn hàng
router.delete("/:orderId", cancelOrder);

export default router;
