// routes/cartRoutes.js
import express from "express";
import {
  getCartByUser,
  addToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  checkStockBeforeCheckout,
  checkoutCart,
} from "../controllers/cartController.js";

const router = express.Router();

/*
  DANH SÁCH API GIỎ HÀNG:
  -------------------------
  - GET    /api/carts/:userId                  → lấy giỏ hàng người dùng
  - POST   /api/carts/add                      → thêm sản phẩm vào giỏ
  - PUT    /api/carts/update                   → cập nhật số lượng
  - DELETE /api/carts/remove                   → xóa sản phẩm khỏi giỏ
  - DELETE /api/carts/clear/:userId            → làm trống giỏ hàng
  - POST   /api/carts/check-stock              → kiểm tra tồn kho
  - POST   /api/carts/checkout                 → thanh toán & tạo đơn hàng
*/

router.get("/:userId", getCartByUser);
router.post("/add", addToCart);
router.put("/update", updateItemQuantity);
router.delete("/remove", removeItemFromCart);
router.delete("/clear/:userId", clearCart);
router.post("/check-stock", checkStockBeforeCheckout);
router.post("/checkout", checkoutCart);

export default router;
