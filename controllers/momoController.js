// controllers/momoController.js
import axios from 'axios';
import CryptoJS from 'crypto-js'; 
import Cart from '../models/cartModel.js';
import Order from '../models/orderModel.js'; 
import PaymentLog from "../models/paymentLogModel.js"; // Đã thêm
// Import này chỉ cần nếu bạn muốn dùng User model, nhưng ta không dùng ở đây

// === BỘ KEY TEST CHUẨN ĐÃ XÁC THỰC ===
const partnerCode = "MOMOBKUN20180529";
const accessKey = "klm05bRhgYk6eN1A";
const secretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";

const apiEndpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

// !!! QUAN TRỌNG: SỬA LẠI URL NÀY VỚI URL HTTPS TỪ NGROK CỦA BẠN !!!
const ngrokUrl = "https://semispontaneously-unsalubrious-angelica.ngrok-free.dev"; 

const redirectUrl = `${ngrokUrl}/home.html`; // Trang sau khi thanh toán
const ipnUrl = `${ngrokUrl}/api/momo/ipn`; // URL Momo gọi về báo kết quả (PHẢI LÀ HTTPS)

// ====================================================================
// === PHẦN 1: TẠO YÊU CẦU THANH TOÁN (CLIENT GỌI) ===
// ====================================================================

export const createMomoPayment = async (req, res) => {
    console.log("--- ĐANG CHẠY CODE CUỐI CÙNG ---"); 
    
    try {
        const { user_id, shipping_address, payment_method } = req.body;

        const cart = await Cart.findOne({ user_id: user_id, status: "ACTIVE" });
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: "Giỏ hàng trống" });
        }
        
        const amount = cart.total_price.toString();
        const orderId = "MM" + new Date().getTime(); 
        const requestId = "RQ" + new Date().getTime();
        const orderInfo = "Thanh toán đơn hàng MeatShop";
        const requestType = "captureWallet";
        const extraData = ""; 

        // 1. TẠO ĐƠN HÀNG (Order)
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
        const savedOrder = await newOrder.save();

        // 2. GHI LOG GIAO DỊCH (PaymentLog) - Trạng thái: Đang xử lý
        const newLog = new PaymentLog({
            order_id: savedOrder._id,
            user_id: user_id,
            payment_method: payment_method, // "Ví điện tử"
            transaction_id: orderId, // Dùng mã orderId của Momo làm mã giao dịch
            amount: cart.total_price,
            status: "Đang xử lý", 
            note: "Đang chuyển hướng sang cổng thanh toán Momo"
        });
        await newLog.save();
        
        // 3. KHÓA GIỎ HÀNG
        cart.status = "CHECKED_OUT"; 
        await cart.save();


        // 4. TẠO CHỮ KÝ (Signature) - Đã sắp xếp đúng thứ tự
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        
        const signature = CryptoJS.HmacSHA256(rawSignature, secretKey)
                                  .toString(CryptoJS.enc.Hex);

        // 5. Gửi yêu cầu đến Momo
        const requestBody = {
            partnerCode, accessKey, requestId, amount, orderId, orderInfo,
            redirectUrl, ipnUrl, extraData, requestType, signature, lang: 'vi'
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


// ====================================================================
// === PHẦN 2: XỬ LÝ TÍN HIỆU TỪ MOMO (IPN) ===
// ====================================================================

export const handleMomoIPN = async (req, res) => {
    console.log("--- NHẬN TÍN HIỆU TỪ MOMO (IPN) ---");
    
    try {
        // 1. Nhận dữ liệu Momo gửi về
        const momoResponse = req.body;
        const { resultCode, orderId, transId, message } = momoResponse;
        
        // 2. Tìm PaymentLog tương ứng (Dựa vào orderId)
        const currentLog = await PaymentLog.findOne({ transaction_id: orderId });

        // Momo yêu cầu phải trả về status 200/204 để tránh việc nó gọi lại liên tục
        if (!currentLog) {
            console.log("Không tìm thấy log giao dịch:", orderId);
            return res.status(200).json({ message: "Log not found" }); 
        }

        // 3. Xử lý kết quả
        if (resultCode == 0) { // resultCode 0 là THÀNH CÔNG
            
            // A. Cập nhật PaymentLog
            currentLog.status = "Hoàn tất"; 
            currentLog.note = `Thanh toán thành công qua Momo. Mã GD Momo: ${transId}.`;
            await currentLog.save();

            // B. Cập nhật Order (Đơn hàng)
            const order = await Order.findById(currentLog.order_id);
            if (order && order.status === 'Chờ xác nhận') {
                order.status = "Đang xử lý"; // Đã trả tiền thì chuyển sang xử lý
                await order.save();
            }

        } else {
            // --- THANH TOÁN THẤT BẠI ---
            currentLog.status = "Thất bại";
            currentLog.note = `Thanh toán thất bại. Lỗi Momo: ${resultCode} - ${message}`;
            await currentLog.save();
        }

        // 4. Trả lời cho Momo biết là mình đã nhận tin (BẮT BUỘC)
        res.status(204).send(); 
        
    } catch (error) {
        console.error("Lỗi xử lý IPN:", error);
        res.status(500).json({ message: "Server error during IPN processing" });
    }
};