// routes/userRoutes.js
import express from "express";
import { registerAdmin } from "../controllers/userController.js";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getCart,
  addToCart,
  createOrder,
  getUserOrders,
  addReview,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Đăng ký & đăng nhập
router.post("/register", registerUser);
router.post("/login", loginUser);

// Route đăng ký admin (chỉ dùng 1 lần)
router.post("/admin", registerAdmin);

// Bảo vệ các route cần đăng nhập
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/cart", protect, getCart);
router.post("/cart", protect, addToCart);
router.post("/order", protect, createOrder);
router.get("/orders", protect, getUserOrders);
router.post("/review", protect, addReview);

export default router;
