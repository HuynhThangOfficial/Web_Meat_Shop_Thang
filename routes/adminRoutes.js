import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
  getAdminProfile,
} from "../controllers/adminController.js";

// Import Middleware bảo vệ
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

/** Auth (Công khai) */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/** Dashboard (Bảo mật) */
router.get("/dashboard/stats", protect, adminOnly, getDashboardStats);
router.get("/profile", protect, adminOnly, getAdminProfile);

/** User Management (Bảo mật) */
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/users/:id", protect, adminOnly, deleteUser);

/** Product Management (Bảo mật) */
router.get("/products", protect, adminOnly, getAllProducts);
router.post("/products", protect, adminOnly, createProduct);
router.put("/products/:id", protect, adminOnly, updateProduct);
router.delete("/products/:id", protect, adminOnly, deleteProduct);

/** Order Management (Bảo mật) */
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/orders/:id", protect, adminOnly, getOrderById);
router.put("/orders/:id/status", protect, adminOnly, updateOrderStatus);

export default router;