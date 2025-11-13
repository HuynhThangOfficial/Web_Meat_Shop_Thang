// routes/cartItemRoutes.js
import express from "express";
import {
  getAllCartItems,
  getCartItemsByCart,
  addCartItem,
  updateCartItemQuantity,
  deleteCartItem,
  clearCartItems,
} from "../controllers/cartItemController.js";

const router = express.Router();

// Lấy toàn bộ cart items (chỉ admin)
router.get("/", getAllCartItems);

// Lấy các item theo cart_id
router.get("/:cartId", getCartItemsByCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/", addCartItem);

// Cập nhật số lượng
router.put("/:cartItemId", updateCartItemQuantity);

// Xóa 1 sản phẩm
router.delete("/:cartItemId", deleteCartItem);

// Xóa toàn bộ sản phẩm trong giỏ
router.delete("/clear/:cartId", clearCartItems);

export default router;
