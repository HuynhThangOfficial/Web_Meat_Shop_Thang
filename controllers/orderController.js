// controllers/orderController.js
import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";
import Product from "../models/productModel.js";
import PaymentLog from "../models/paymentLogModel.js";

/**
 *  Lấy tất cả đơn hàng (Admin)
 */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id", "username fullName email")
      .populate("items.product_id", "name price");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng", error });
  }
};

/**
 *  Lấy danh sách đơn hàng của một user
 */
export const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user_id: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy đơn hàng người dùng", error });
  }
};

/**
 *  Lấy chi tiết một đơn hàng
 */
export const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user_id", "fullName email phone address")
      .populate("items.product_id", "name price image stock");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng", error });
  }
};

/**
 *  Tạo đơn hàng mới từ giỏ hàng
 */
export const createOrderFromCart = async (req, res) => {
  try {
    const { user_id, shipping_address, payment_method } = req.body;

    // Lấy giỏ hàng
    const cart = await Cart.findOne({ user_id });
    if (!cart) {
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng." });
    }

    // Lấy các item trong giỏ
    const cartItems = await CartItem.find({ cart_id: cart._id }).populate(
      "product_id"
    );
    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Giỏ hàng rỗng, không thể đặt hàng." });
    }

    // Tạo danh sách items
    const items = cartItems.map((item) => ({
      product_id: item.product_id._id,
      name: item.product_id.name,
      unit_price: item.product_id.price,
      quantity: item.quantity,
      line_total: item.product_id.price * item.quantity,
    }));

    // Tổng tiền
    const total_amount = items.reduce((sum, i) => sum + i.line_total, 0);

    // Tạo đơn hàng
    const newOrder = new Order({
      user_id,
      items,
      total_amount,
      status: "Chờ xác nhận",
      shipping_address,
      payment_method,
    });
    await newOrder.save();

    // Cập nhật tồn kho sản phẩm
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    // Tạo log thanh toán
    const paymentLog = new PaymentLog({
      order_id: newOrder._id,
      user_id,
      transaction_id: `TXN-${Date.now()}`, // tạo mã giao dịch tự động
      payment_method, // đúng với tên trong model
      amount: total_amount,
      status: "Đang xử lý",
    });
    await paymentLog.save();

    // Xóa giỏ hàng
    await CartItem.deleteMany({ cart_id: cart._id });
    cart.total_price = 0;
    await cart.save();

    res.status(201).json({ message: "Đặt hàng thành công.", order: newOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo đơn hàng.", error: error.message });
  }
};

/**
 *  Cập nhật trạng thái đơn hàng (Admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    order.status = status;
    await order.save();

    // Nếu hoàn tất -> cập nhật PaymentLog
    if (status === "Đã giao") {
      const paymentLog = await PaymentLog.findOne({ order_id: orderId });
      if (paymentLog) {
        paymentLog.status = "Hoàn tất";
        await paymentLog.save();
      }
      order.payment_status = "Đã thanh toán";
      await order.save();
    }

    res.status(200).json({ message: "Cập nhật trạng thái thành công.", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái.", error });
  }
};

/**
 *  Hủy đơn hàng
 */
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

    order.status = "Đã hủy";
    await order.save();

    // Hoàn lại tồn kho
    for (const item of order.items) {
      const product = await Product.findById(item.product_id);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Cập nhật PaymentLog
    const paymentLog = await PaymentLog.findOne({ order_id: orderId });
    if (paymentLog) {
      paymentLog.status = "Hoàn tiền";
      await paymentLog.save();
    }

    order.payment_status = "Hoàn tiền";
    await order.save();

    res
      .status(200)
      .json({ message: "Đã hủy đơn hàng và hoàn lại tồn kho.", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hủy đơn hàng.", error });
  }
};
