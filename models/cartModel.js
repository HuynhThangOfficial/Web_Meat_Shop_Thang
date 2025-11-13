// models/cartModel.js
import mongoose from "mongoose";

/*
  MÔ TẢ:
  -------
  Mỗi user có 1 giỏ hàng.
  Giỏ hàng chứa mảng các items (mỗi item là 1 sản phẩm).
  Các trường trong items:
    - product_id: tham chiếu đến bảng Product
    - name: tên sản phẩm
    - price: giá tại thời điểm thêm vào giỏ
    - quantity: số lượng
  Các trường chính của giỏ hàng:
    - total_price: tổng giá trị giỏ hàng
    - status: ACTIVE (đang mua), CHECKED_OUT (đã thanh toán)
*/

const cartItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    total_price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CHECKED_OUT"],
      default: "ACTIVE",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Tính tổng tiền trước khi lưu
cartSchema.pre("save", function (next) {
  this.total_price = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  next();
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
