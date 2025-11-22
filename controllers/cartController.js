// controllers/cartController.js
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import PaymentLog from "../models/paymentLogModel.js"; 

// 1. Lấy giỏ hàng
export const getCartByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await Cart.findOne({ user_id: userId, status: "ACTIVE" }).populate(
      "items.product_id"
    );

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng trống", items: [] });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy giỏ hàng", error: error.message });
  }
};

// 2. Thêm vào giỏ
export const addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    let cart = await Cart.findOne({ user_id, status: "ACTIVE" });

    if (!cart) {
      cart = new Cart({ user_id, items: [] });
    }

    const existingItem = cart.items.find(item => item.product_id.toString() === product_id);
    const product = await Product.findById(product_id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product_id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    cart.total_price = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.status(200).json({ message: "Đã thêm vào giỏ", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm giỏ hàng", error: error.message });
  }
};

// 3. Cập nhật số lượng
export const updateItemQuantity = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const cart = await Cart.findOne({ user_id, status: "ACTIVE" });
    
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const item = cart.items.find(item => item.product_id.toString() === product_id);
    if (item) {
      item.quantity = quantity;
      cart.total_price = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await cart.save();
    }
    
    res.status(200).json({ message: "Đã cập nhật", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
  }
};

// 4. Xóa sản phẩm
export const removeItemFromCart = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    const cart = await Cart.findOne({ user_id, status: "ACTIVE" });
    
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    cart.items = cart.items.filter(item => item.product_id.toString() !== product_id);
    cart.total_price = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.status(200).json({ message: "Đã xóa", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa", error: error.message });
  }
};

// 5. Các hàm phụ (Giữ nguyên khung để không lỗi import)
export const clearCart = async (req, res) => {};
export const checkStockBeforeCheckout = async (req, res) => {};

// 7. THANH TOÁN (CHECKOUT TIỀN MẶT) - QUAN TRỌNG
export const checkoutCart = async (req, res) => {
  try {
    const { user_id, shipping_address, payment_method } = req.body;

    const cart = await Cart.findOne({ user_id, status: "ACTIVE" }).populate("items.product_id");
    if (!cart) return res.status(404).json({ message: "Giỏ hàng trống" });

    // A. Tạo Đơn Hàng
    const newOrder = new Order({
      user_id,
      items: cart.items.map(i => ({
        product_id: i.product_id._id,
        name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
        line_total: i.price * i.quantity
      })),
      total_amount: cart.total_price,
      status: "Chờ xác nhận",
      shipping_address,
      payment_method
    });

    const savedOrder = await newOrder.save();

    // B. Ghi Payment Log (Sửa cho khớp model của bạn)
    try {
        const newLog = new PaymentLog({
            order_id: savedOrder._id,
            user_id: user_id,
            payment_method: payment_method, // "Tiền mặt"
            transaction_id: "COD_" + Date.now(),
            amount: cart.total_price,
            status: "Đang xử lý", // <--- KHỚP VỚI MODEL CỦA BẠN
            note: "Thanh toán khi nhận hàng (COD)"
        });
        await newLog.save();
    } catch (logErr) {
        console.log("Lỗi ghi log:", logErr.message);
    }

    // C. Giảm tồn kho
    for (let item of cart.items) {
        const product = await Product.findById(item.product_id._id);
        if(product) {
            product.stock -= item.quantity;
            await product.save();
        }
    }

    // D. Cập nhật giỏ hàng
    cart.status = "CHECKED_OUT";
    await cart.save();

    res.status(200).json({ message: "Thanh toán thành công", order: savedOrder });

  } catch (error) {
    console.error("Lỗi Checkout:", error);
    res.status(500).json({ message: "Lỗi thanh toán", error: error.message });
  }
};