// services/paymentLogService.js
import PaymentLog from "../models/paymentLogModel.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

/*
  Tầng Service: xử lý logic nghiệp vụ.
  Tầng này tách biệt controller và model để dễ bảo trì, test và mở rộng.
*/

export const createPaymentLog = async (data) => {
  const { order_id, user_id, payment_method, transaction_id, amount, note } =
    data;

  // Kiểm tra người dùng tồn tại
  const user = await User.findById(user_id);
  if (!user) throw new Error("Người dùng không tồn tại!");

  // Kiểm tra đơn hàng tồn tại
  const order = await Order.findById(order_id);
  if (!order) throw new Error("Đơn hàng không tồn tại!");

  // Tạo log thanh toán
  const paymentLog = await PaymentLog.create({
    order_id,
    user_id,
    payment_method,
    transaction_id,
    amount,
    note,
    status: "Chờ xử lý",
  });

  return paymentLog;
};

// Lấy tất cả log thanh toán
export const getAllPaymentLogs = async () => {
  return await PaymentLog.find()
    .populate("user_id", "fullName email")
    .populate("order_id", "total_amount status");
};

// Lấy log theo ID
export const getPaymentLogById = async (id) => {
  return await PaymentLog.findById(id)
    .populate("user_id", "fullName email")
    .populate("order_id", "total_amount status");
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (id, status) => {
  const log = await PaymentLog.findById(id);
  if (!log) throw new Error("Không tìm thấy log thanh toán!");

  log.status = status;
  await log.save();

  // Nếu thanh toán thành công -> cập nhật đơn hàng
  if (status === "Thành công") {
    await Order.findByIdAndUpdate(log.order_id, { status: "Đã thanh toán" });
  }

  return log;
};

// Xóa log (chỉ Admin)
export const deletePaymentLog = async (id) => {
  return await PaymentLog.findByIdAndDelete(id);
};
