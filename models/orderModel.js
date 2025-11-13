// models/orderModel.js
import mongoose from "mongoose";

/**
 * Schema cho đơn hàng (Orders)
 * Mỗi đơn hàng thuộc về 1 user và chứa danh sách sản phẩm (items)
 */
const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Danh sách sản phẩm trong đơn
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        unit_price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        line_total: { type: Number, required: true },
      },
    ],

    // Tổng giá trị đơn hàng
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Chờ xác nhận",
        "Đang xử lý",
        "Đang giao hàng",
        "Đã giao",
        "Đã hủy",
      ],
      default: "Chờ xác nhận",
    },

    shipping_address: {
      type: String,
      required: true,
      trim: true,
    },

    payment_method: {
      type: String,
      enum: [
        "Chuyển khoản ngân hàng",
        "Tiền mặt",
        "Ví điện tử",
        "Thẻ tín dụng",
      ],
      required: true,
    },

    payment_status: {
      type: String,
      enum: ["Processing", "Delivered", "Cancelled"],
      default: "Processing",
    },
  },
  {
    timestamps: true, // tự động thêm createdAt và updatedAt
  }
);

// Middleware tự tính total_amount nếu chưa có
orderSchema.pre("save", function (next) {
  if (!this.total_amount && this.items && this.items.length > 0) {
    this.total_amount = this.items.reduce((sum, i) => sum + i.line_total, 0);
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
