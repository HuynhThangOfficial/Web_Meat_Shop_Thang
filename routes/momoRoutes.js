// routes/momoRoutes.js
import express from 'express';
// === SỬA LỖI: Import thêm hàm handleMomoIPN ===
import { createMomoPayment, handleMomoIPN } from '../controllers/momoController.js'; 

const router = express.Router();

// API tạo thanh toán (Frontend gọi)
router.post('/create-payment', createMomoPayment);

// === API nhận kết quả từ Momo (Momo Server gọi) ===
// Sửa dòng này để trỏ vào hàm xử lý IPN thật
router.post('/ipn', handleMomoIPN); 

export default router;