// models/cartItemModel.js
import mongoose from "mongoose";

/**
 * Schema cho từng mục hàng trong giỏ (Cart Item)
 * Mỗi cart item sẽ thuộc về một giỏ hàng (cart_id)
 * và trỏ tới sản phẩm cụ thể (product_id)
 */
const cartItemSchema = new mongoose.Schema(
  {
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart", // liên kết tới bảng carts
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // liên kết tới bảng products
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true, // tự động thêm createdAt và updatedAt
  }
);

// Middleware: tự động tính subtotal trước khi lưu
cartItemSchema.pre("save", function (next) {
  this.subtotal = this.price * this.quantity;
  next();
});

const CartItem = mongoose.model("CartItem", cartItemSchema);

export default CartItem;
