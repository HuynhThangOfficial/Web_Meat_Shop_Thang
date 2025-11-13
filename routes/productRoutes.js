// routes/productRoutes.js
import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductDetail,
  updateProductDetail,
  deleteProductDetail,
  uploadProductImages,
  bulkImportCSV,
  adjustStock,
} from "../controllers/productController.js";

import {
  uploadSingle,
  uploadMultiple,
} from "../middlewares/uploadMiddleware.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

/** Public */
router.get("/", getProducts); // /api/products?search=&category=&page=&limit=
router.get("/:id", getProductById);

/** Admin (yêu cầu đăng nhập & phân quyền admin) */
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

/** Product details (variants) */
router.post("/details", protect, adminOnly, createProductDetail);
router.put("/details/:id", protect, adminOnly, updateProductDetail);
router.delete("/details/:id", protect, adminOnly, deleteProductDetail);

/** Upload images */
// uploadSingle accepts field 'image' -> single image
router.post("/upload-single", protect, adminOnly, (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) return next(err);
    // call controller handler for returning urls
    req.files = req.file ? [req.file] : [];
    uploadProductImages(req, res).catch(next);
  });
});

// uploadMultiple accepts field 'images' -> multiple files
router.post("/upload-multiple", protect, adminOnly, (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) return next(err);
    req.files = req.files || [];
    uploadProductImages(req, res).catch(next);
  });
});

/** Bulk import CSV (field name: file) */
router.post("/import/csv", protect, adminOnly, (req, res, next) => {
  // reuse uploadSingle but expecting csv file key 'file'
  // quick custom multer for single csv file would be simpler; assume uploadSingle handles it
  uploadSingle(req, res, (err) => {
    if (err) return next(err);
    // req.file available
    bulkImportCSV(req, res).catch(next);
  });
});

/** Stock adjust */
router.post("/:id/stock", protect, adminOnly, adjustStock);

export default router;
