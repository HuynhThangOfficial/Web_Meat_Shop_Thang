// controllers/paymentLogController.js
import * as PaymentLogService from "../services/paymentLogService.js";

/*
  Controller đóng vai trò trung gian giữa route và service.
  Nó nhận request từ client, gọi service xử lý, rồi trả kết quả về.
*/

export const createPaymentLog = async (req, res) => {
  try {
    const log = await PaymentLogService.createPaymentLog(req.body);
    res.status(201).json({
      message: "Tạo log thanh toán thành công!",
      data: log,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllPaymentLogs = async (req, res) => {
  try {
    const logs = await PaymentLogService.getAllPaymentLogs();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentLogById = async (req, res) => {
  try {
    const log = await PaymentLogService.getPaymentLogById(req.params.id);
    if (!log) return res.status(404).json({ error: "Không tìm thấy log!" });
    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const log = await PaymentLogService.updatePaymentStatus(
      req.params.id,
      status
    );
    res.status(200).json({
      message: "Cập nhật trạng thái thanh toán thành công!",
      data: log,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePaymentLog = async (req, res) => {
  try {
    await PaymentLogService.deletePaymentLog(req.params.id);
    res.status(200).json({ message: "Xóa log thanh toán thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
