// routes/productDetailRoutes.js
import express from "express";
import {
  getAllProductDetails,
  getProductDetailById,
  getDetailsByProductId,
  createProductDetail,
  updateProductDetail,
  deleteProductDetail,
} from "../controllers/productDetailController.js";

const router = express.Router();

/*
  Đường dẫn API cho ProductDetail:
  - GET /api/productdetails → lấy tất cả chi tiết
  - GET /api/productdetails/:id → lấy chi tiết theo id
  - GET /api/productdetails/byProduct/:productId → lấy chi tiết theo sản phẩm
  - POST /api/productdetails → thêm mới
  - PUT /api/productdetails/:id → cập nhật
  - DELETE /api/productdetails/:id → xóa
*/

router.get("/", getAllProductDetails);
router.get("/:id", getProductDetailById);
router.get("/byProduct/:productId", getDetailsByProductId);
router.post("/", createProductDetail);
router.put("/:id", updateProductDetail);
router.delete("/:id", deleteProductDetail);

export default router;
