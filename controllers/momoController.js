// controllers/momoController.js
import axios from 'axios';
import CryptoJS from 'crypto-js'; 
import Cart from '../models/cartModel.js';
import Order from '../models/orderModel.js'; 

// === SỬA LỖI: DÙNG BỘ KEY TEST MỚI NHẤT TỪ CHATGPT ===
const partnerCode = "MOMO";
const accessKey = "F8BBA842ECF85";
const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
// =======================================================

const apiEndpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

// !!! QUAN TRỌNG: BẠN SẼ SỬA LẠI URL NÀY Ở BƯỚC 2 !!!
const ngrokUrl = "https://semispontaneously-unsalubrious-angelica.ngrok-free.dev"; // URL HTTPS TẠM THỜI

const redirectUrl = `${ngrokUrl}/home.html`; // Trang sau khi thanh toán
const ipnUrl = `${ngrokUrl}/api/momo/ipn`; // URL Momo gọi về báo kết quả

export const createMomoPayment = async (req, res) => {
    // Dòng kiểm tra (Dấu hiệu)
    console.log("--- ĐANG CHẠY CODE MOI NHAT (Key MomoTest2024) ---"); 
    
    try {
        // Đọc đúng key "snake_case" từ frontend
        const { user_id, shipping_address, payment_method } = req.body;

        // 1. Lấy giỏ hàng để biết tổng tiền
        const cart = await Cart.findOne({ user_id: user_id, status: "ACTIVE" });
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy giỏ hàng hoặc giỏ hàng trống" });
        }
        
        const amount = cart.total_price.toString();
        const orderId = "MM" + new Date().getTime(); 
        const requestId = "RQ" + new Date().getTime();
        const orderInfo = "Thanh toán đơn hàng MeatShop";
        const requestType = "captureWallet";
        const extraData = ""; 

        // 2. TẠO ĐƠN HÀNG (Order)
        const newOrder = new Order({
            user_id: user_id,
            items: cart.items.map(i => ({
                product_id: i.product_id,
                name: i.name,
                unit_price: i.price,
                quantity: i.quantity,
                line_total: i.price * i.quantity,
            })),
            total_amount: cart.total_price,
            status: "Chờ xác nhận", 
            shipping_address: shipping_address,
            payment_method: payment_method,
        });
        await newOrder.save();
        
        // 3. Cập nhật giỏ hàng 
        cart.status = "CHECKED_OUT"; // Khóa giỏ hàng
        await cart.save();


        // 4. TẠO CHỮ KÝ (Signature)
        // (Đã sắp xếp đúng thứ tự và có accessKey)
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        
        const signature = CryptoJS.HmacSHA256(rawSignature, secretKey)
                                  .toString(CryptoJS.enc.Hex);

        // 5. Gửi yêu cầu đến Momo
        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature, 
            lang: 'vi'
        };

        const response = await axios.post(apiEndpoint, requestBody);

        // 6. Trả link thanh toán về cho Frontend
        res.status(200).json({ payUrl: response.data.payUrl });

    } catch (error) {
        if (error.response && error.response.data) {
            console.error("Lỗi từ Momo:", error.response.data);
        } else {
            console.error("Lỗi khi tạo thanh toán Momo:", error);
        }
        res.status(500).json({ message: "Lỗi server khi tạo thanh toán", error: error.message });
    }
};