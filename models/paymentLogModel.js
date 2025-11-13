// models/paymentLogModel.js
import mongoose from "mongoose";

/*
  Đây là schema dùng để lưu log thanh toán của hệ thống MeatShop.
  Nó liên kết chặt chẽ với Order (đơn hàng) và User (người dùng).
  Mỗi log đại diện cho 1 lần thanh toán — thành công hoặc thất bại.
*/

const paymentLogSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Đang xử lý", "Hoàn tất", "Thất bại", "Hoàn tiền"],
      default: "Đang xử lý",
    },
    note: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Tạo model từ schema
const PaymentLog = mongoose.model("PaymentLog", paymentLogSchema);
export default PaymentLog;
