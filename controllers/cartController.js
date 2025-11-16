// controllers/cartController.js
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import ProductDetail from "../models/productDetailModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

/*
  CHỨC NĂNG CHÍNH:
  ----------------
  1. Lấy giỏ hàng của người dùng
  2. Thêm sản phẩm vào giỏ
  3. Cập nhật số lượng
  4. Xóa sản phẩm khỏi giỏ
  5. Làm trống giỏ hàng
  6. Kiểm tra tồn kho
  7. Tạo đơn hàng từ giỏ hàng
*/

// Lấy giỏ hàng của người dùng
export const getCartByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await Cart.findOne({ user_id: userId, status: "ACTIVE" }).populate(
      "items.product_id"
    );

    if (!cart) {
      return res.status(404).json({ message: "Người dùng chưa có giỏ hàng" });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy giỏ hàng", error });
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(user_id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(product_id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Kiểm tra giỏ hàng có tồn tại chưa
    let cart = await Cart.findOne({ user_id, status: "ACTIVE" });

    if (!cart) {
      // Nếu chưa có thì tạo mới
      cart = new Cart({
        user_id,
        items: [],
      });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product_id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    // Lưu lại tổng tiền
    cart.total_price = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Đã thêm sản phẩm vào giỏ hàng",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm vào giỏ", error });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ
export const updateItemQuantity = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;
    const cart = await Cart.findOne({ user_id, status: "ACTIVE" });

    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const item = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );
    if (!item)
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });

    // Cập nhật số lượng
    item.quantity = quantity;

    // Cập nhật tổng tiền
    cart.total_price = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
    res.status(200).json({ message: "Đã cập nhật số lượng", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật số lượng", error });
  }
};

// Xóa sản phẩm khỏi giỏ
export const removeItemFromCart = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    const cart = await Cart.findOne({ user_id, status: "ACTIVE" });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // Lọc bỏ sản phẩm cần xóa
    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== product_id
    );

    // Cập nhật lại tổng giá
    cart.total_price = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error });
  }
};

// Làm trống giỏ hàng
export const clearCart = async (req, res) => {
  try {
    const user_id = req.params.userId;
    const cart = await Cart.findOne({ user_id, status: "ACTIVE" });
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    cart.items = [];
    cart.total_price = 0;
    await cart.save();

    res.status(200).json({ message: "Đã làm trống giỏ hàng", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi làm trống giỏ hàng", error });
  }
};

// Kiểm tra tồn kho trước khi đặt hàng
export const checkStockBeforeCheckout = async (req, res) => {
  try {
    const { user_id } = req.body;
    const cart = await Cart.findOne({ user_id, status: "ACTIVE" }).populate(
      "items.product_id"
    );

    if (!cart) return res.status(404).json({ message: "Không có giỏ hàng" });

    const outOfStock = [];
    for (let item of cart.items) {
      if (item.quantity > item.product_id.stock) {
        outOfStock.push(item.name);
      }
    }

    if (outOfStock.length > 0) {
      return res.status(400).json({
        message: "Một số sản phẩm không đủ hàng",
        outOfStock,
      });
    }

    res.status(200).json({ message: "Tất cả sản phẩm đều đủ hàng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm tra tồn kho", error });
  }
};

// Thanh toán → tạo Order từ Cart
export const checkoutCart = async (req, res) => {
  try {
    const { user_id, shipping_address, payment_method } = req.body;

    const cart = await Cart.findOne({ user_id, status: "ACTIVE" }).populate(
      "items.product_id"
    );
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    // Kiểm tra tồn kho trước khi tạo đơn
    for (let item of cart.items) {
      if (item.quantity > item.product_id.stock) {
        return res.status(400).json({
          message: `Sản phẩm ${item.name} không đủ hàng`,
        });
      }
    }

    // Tạo đơn hàng mới
    const newOrder = new Order({
      user_id,
      items: cart.items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
        line_total: i.price * i.quantity,
      })),
      total_amount: cart.total_price,
      status: "Chờ xác nhận",
      shipping_address,
      payment_method,
    });

    await newOrder.save();

    // Giảm tồn kho
    for (let item of cart.items) {
      const product = await Product.findById(item.product_id);
      product.stock -= item.quantity;
      await product.save();
    }

    // Cập nhật trạng thái giỏ hàng
    cart.status = "CHECKED_OUT";
    await cart.save();

    res.status(200).json({
      message: "Thanh toán thành công, đã tạo đơn hàng",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thanh toán giỏ hàng", error });
  }
};
