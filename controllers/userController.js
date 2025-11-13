// =============================================
// controllers/userController.js
// Chức năng: Quản lý người dùng (Đăng ký, đăng nhập, cập nhật, tạo admin, giỏ hàng, đơn hàng, đánh giá)
// =============================================

import User from "../models/userModel.js";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Review from "../models/reviewModel.js";
import PaymentLog from "../models/paymentLogModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";

// =============================================
//  Hàm tạo JWT Token (dùng để xác thực người dùng)
// =============================================
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// =============================================
//  Đăng ký tài khoản người dùng thường
// =============================================
export const registerUser = async (req, res) => {
  try {
    const { username, password, fullName, email, phone, address } = req.body;

    // Kiểm tra trùng username hoặc email
    const exist = await User.findOne({ $or: [{ username }, { email }] });
    if (exist) {
      return res
        .status(400)
        .json({ message: "Username hoặc email đã tồn tại" });
    }

    // Tạo user mới
    const user = await User.create({
      username,
      password,
      fullName,
      email,
      phone,
      address,
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// =============================================
//  Đăng nhập
// =============================================
export const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  //  Tìm theo username hoặc email
  const user = await User.findOne({
    $or: [{ username }, { email: username }, { email }],
  });

  if (!user) {
    res.status(404);
    throw new Error("Tài khoản không tồn tại");
  }

  //  So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Sai mật khẩu");
  }

  //  Tạo token
  const token = generateToken(user._id);

  res.json({
    message: "Đăng nhập thành công",
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

// =============================================
//  Xem thông tin cá nhân
// =============================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng" });
  }
};

// =============================================
//  Cập nhật thông tin cá nhân
// =============================================
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone, address },
      { new: true }
    ).select("-password");

    res.json({ message: "Cập nhật thành công", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thông tin" });
  }
};

// =============================================
//  Xem giỏ hàng
// =============================================
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart) return res.json({ message: "Giỏ hàng trống" });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy giỏ hàng" });
  }
};

// =============================================
//  Thêm sản phẩm vào giỏ
// =============================================
export const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    const product = await Product.findById(product_id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    let cart = await Cart.findOne({ user_id: req.user.id });

    // Nếu giỏ chưa có, tạo mới
    if (!cart) {
      cart = new Cart({
        user_id: req.user.id,
        items: [],
        total_price: 0,
        status: "ACTIVE",
      });
    }

    // Kiểm tra sản phẩm đã tồn tại trong giỏ chưa
    const existingItem = cart.items.find((item) =>
      item.product_id.equals(product_id)
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

    // Cập nhật tổng tiền
    cart.total_price = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    res.json({ message: "Đã thêm vào giỏ hàng", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi thêm sản phẩm vào giỏ", error: error.message });
  }
};

// =============================================
//  Tạo đơn hàng từ giỏ hàng
// =============================================
export const createOrder = async (req, res) => {
  try {
    const { shipping_address, payment_method } = req.body;
    const cart = await Cart.findOne({ user_id: req.user.id });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Giỏ hàng trống" });

    const order = await Order.create({
      user_id: req.user.id,
      items: cart.items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
      })),
      total_amount: cart.total_price,
      status: "Chờ xác nhận",
      shipping_address,
      payment_method,
      createdAt: new Date(),
    });

    // Sau khi tạo đơn, làm trống giỏ
    cart.items = [];
    cart.total_price = 0;
    await cart.save();

    // Lưu vào PaymentLogs (ghi nhận thanh toán)
    await PaymentLog.create({
      user_id: req.user.id,
      order_id: order._id,
      method: payment_method,
      amount: order.total_amount,
      status: "Đang xử lý",
      createdAt: new Date(),
    });

    res.json({ message: "Đã tạo đơn hàng", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo đơn hàng", error: error.message });
  }
};

// =============================================
//  Xem lịch sử đơn hàng
// =============================================
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch sử đơn hàng" });
  }
};

// =============================================
//  Viết đánh giá sản phẩm
// =============================================
export const addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    const review = await Review.create({
      user_id: req.user.id,
      product_id,
      rating,
      comment,
      createdAt: new Date(),
    });

    res.json({ message: "Đánh giá thành công", review });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi thêm đánh giá", error: error.message });
  }
};

// =============================================
// Tạo tài khoản Admin (chỉ dùng 1 lần, thủ công)
// =============================================
export const registerAdmin = async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body;

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin đã tồn tại" });
    }

    // Mã hoá mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản admin mới
    const newAdmin = await User.create({
      username,
      password: hashedPassword,
      fullName,
      email,
      role: role || "admin", // nếu không nhập role thì mặc định là admin
    });

    res.status(201).json({
      message: "Tạo admin thành công",
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error(" Lỗi tạo admin:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
