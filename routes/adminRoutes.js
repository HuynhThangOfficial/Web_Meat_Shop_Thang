/**
 * routes/adminRoutes.js
 * Tất cả route dành cho admin.
 *
 * Lưu ý: cần mount vào server.js như:
 *   app.use("/api/admin", adminRoutes)
 *
 * Các route quan trọng:
 *  - POST /api/admin/register
 *  - POST /api/admin/login
 *  - GET /api/admin/profile
 *  - GET /api/admin/admins
 *  - GET /api/admin/users
 *  - GET/POST/PUT/DELETE /api/admin/products ...
 *  - GET /api/admin/dashboard
 */

import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductDetail,
  updateProductDetail,
  deleteProductDetail,
  getAllCarts,
  getCartById,
  clearCart,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getPaymentLogs,
  createPaymentLog,
  getAllReviews,
  deleteReview,
  getDashboardStats,
  getAdminProfile,
  deleteUser,
} from "../controllers/adminController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

/** Auth */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/** Thêm route lấy thông tin admin đang đăng nhập */
router.get("/profile", protect, adminOnly, getAdminProfile);

/** Admin management (admin only) */
router.get("/admins", protect, adminOnly, getAdmins);
router.get("/admins/:id", protect, adminOnly, getAdminById);
router.put("/admins/:id", protect, adminOnly, updateAdmin);
router.delete("/admins/:id", protect, adminOnly, deleteAdmin);

/** User management */
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/:id", protect, adminOnly, getUserById);
router.put("/users/:id/block", protect, adminOnly, blockUser);
router.put("/users/:id/unblock", protect, adminOnly, unblockUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);

/** Category management */
router.get("/categories", protect, adminOnly, getAllCategories);
router.post("/categories", protect, adminOnly, createCategory);
router.put("/categories/:id", protect, adminOnly, updateCategory);
router.delete("/categories/:id", protect, adminOnly, deleteCategory);

/** Product management */
router.get("/products", protect, adminOnly, getAllProducts);
router.get("/products/:id", protect, adminOnly, getProductById);
router.post("/products", protect, adminOnly, createProduct);
router.put("/products/:id", protect, adminOnly, updateProduct);
router.delete("/products/:id", protect, adminOnly, deleteProduct);

/** Product details (variants) */
router.post("/product-details", protect, adminOnly, createProductDetail);
router.put("/product-details/:id", protect, adminOnly, updateProductDetail);
router.delete("/product-details/:id", protect, adminOnly, deleteProductDetail);

/** Cart management */
router.get("/carts", protect, adminOnly, getAllCarts);
router.get("/carts/:id", protect, adminOnly, getCartById);
router.delete("/carts/:id/clear", protect, adminOnly, clearCart);

/** Order management */
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/orders/:id", protect, adminOnly, getOrderById);
router.put("/orders/:id/status", protect, adminOnly, updateOrderStatus);

/** Payment logs */
router.get("/payment-logs", protect, adminOnly, getPaymentLogs);
router.post("/payment-logs", protect, adminOnly, createPaymentLog);

/** Reviews */
router.get("/reviews", protect, adminOnly, getAllReviews);
router.delete("/reviews/:id", protect, adminOnly, deleteReview);

/** Dashboard */
router.get("/dashboard/stats", protect, adminOnly, getDashboardStats);

export default router;
