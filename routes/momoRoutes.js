// routes/momoRoutes.js
import express from 'express';
import { createMomoPayment } from '../controllers/momoController.js';

const router = express.Router();

// API này frontend sẽ gọi
router.post('/create-payment', createMomoPayment);

// API này Momo sẽ gọi (chúng ta chưa xử lý, nhưng nó phải tồn tại)
router.post('/ipn', (req, res) => {
    // Momo sẽ gọi URL này sau khi user thanh toán
    console.log("Momo IPN received:", req.body);
    // (Trong thực tế, bạn sẽ xác thực chữ ký và cập nhật DB ở đây)
    res.status(204).send(); // Phản hồi 204 No Content cho Momo
});

export default router;