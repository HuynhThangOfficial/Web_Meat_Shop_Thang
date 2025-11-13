// routes/categoryRoutes.js
import express from "express";
import {
  getAllCategories,
  getCategoryById,
  getCategoryWithProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  changeCategoryStatus,
  searchCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

/*
  Các đường dẫn API cho Category:
  -------------------------------
  - GET /api/categories → lấy tất cả danh mục
  - GET /api/categories/active → lấy danh mục đang active
  - GET /api/categories/:id → lấy danh mục theo ID
  - GET /api/categories/:id/products → lấy danh mục kèm sản phẩm + chi tiết sản phẩm
  - GET /api/categories/search?keyword=... → tìm kiếm danh mục
  - POST /api/categories → thêm mới
  - PUT /api/categories/:id → cập nhật thông tin
  - PATCH /api/categories/:id/status → đổi trạng thái
  - DELETE /api/categories/:id → xóa danh mục (nếu không chứa sản phẩm)
*/

router.get("/", getAllCategories);
router.get("/active", getActiveCategories);
router.get("/search", searchCategory);
router.get("/:id", getCategoryById);
router.get("/:id/products", getCategoryWithProducts);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id/status", changeCategoryStatus);
router.delete("/:id", deleteCategory);

export default router;
