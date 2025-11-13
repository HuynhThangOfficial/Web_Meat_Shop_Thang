/**
 * controllers/adminController.js
 *
 * Chứa các handler (controller) dành cho admin:
 * - Authentication: registerAdmin, loginAdmin
 * - Admin CRUD: getAdmins, getAdminById, updateAdmin, deleteAdmin
 * - Quản lý Users: getAllUsers, getUserById, blockUser, unblockUser
 * - Quản lý Products/Categories/ProductDetails: CRUD cơ bản
 * - Quản lý Carts & CartItems: xem giỏ hàng, clear cart
 * - Quản lý Orders: getAllOrders, getOrderById, updateOrderStatus
 * - Quản lý PaymentLogs: getPaymentLogs
 * - Quản lý Reviews: getAllReviews, deleteReview
 * - Dashboard: getDashboardStats (số lượng users, products, orders, doanh thu tạm tính)
 *
 * LƯU Ý:
 * - Controller giả định bạn đã tạo các model tương ứng với tên import phía dưới.
 * - Các thao tác thay đổi dữ liệu (ví dụ xóa product) có thể đòi hỏi thêm check liên quan (orders đã đặt,...).
 */

import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";

// Models (bạn phải tạo các model này trong /models)
import Admin from "../models/adminModel.js";
import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import ProductDetail from "../models/productDetailModel.js";
import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";
import Order from "../models/orderModel.js";
import PaymentLog from "../models/paymentLogModel.js";
import Review from "../models/reviewModel.js";

/* -------------------------
   AUTH: Register admin
   ------------------------- */
export const registerAdmin = asyncHandler(async (req, res) => {
  const { username, password, fullName, email } = req.body;

  if (!username || !password || !fullName || !email) {
    res.status(400);
    throw new Error("Vui lòng cung cấp username, password, fullName, email");
  }

  const existUser = await Admin.findOne({ $or: [{ username }, { email }] });
  if (existUser) {
    res.status(400);
    throw new Error("Username hoặc email đã tồn tại");
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const newAdmin = await Admin.create({
    username,
    password: hashed,
    fullName,
    email,
  });

  // Trả về thông tin cơ bản và token
  res.status(201).json({
    _id: newAdmin._id,
    username: newAdmin.username,
    fullName: newAdmin.fullName,
    email: newAdmin.email,
    role: newAdmin.role,
    token: generateToken(newAdmin),
  });
});

/* -------------------------
   AUTH: Login admin
   ------------------------- */
export const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Tìm admin theo username hoặc email
  const admin = await Admin.findOne({
    $or: [{ username }, { email: username }], // cho phép login bằng email
  });

  if (!admin) {
    res.status(401);
    throw new Error("Tài khoản admin không tồn tại");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Sai mật khẩu");
  }

  res.json({
    _id: admin._id,
    username: admin.username,
    fullName: admin.fullName,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin),
  });
});

/* -------------------------
   ADMIN CRUD
   ------------------------- */
export const getAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().select("-password");
  res.json(admins);
});

export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id).select("-password");
  if (!admin) {
    res.status(404);
    throw new Error("Admin không tồn tại");
  }
  res.json(admin);
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    res.status(404);
    throw new Error("Admin không tồn tại");
  }

  // Chỉ admin cấp cao mới có thể thay đổi role (logic tùy bạn)
  admin.fullName = req.body.fullName || admin.fullName;
  admin.email = req.body.email || admin.email;
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(req.body.password, salt);
  }

  const updated = await admin.save();
  res.json({
    _id: updated._id,
    username: updated.username,
    fullName: updated.fullName,
    email: updated.email,
    role: updated.role,
  });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    res.status(404);
    throw new Error("Admin không tồn tại");
  }

  await admin.remove();
  res.json({ message: "Admin đã bị xóa" });
});

/* -------------------------
   QUẢN LÝ USERS
   ------------------------- */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User không tồn tại");
  }
  res.json(user);
});

export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User không tồn tại");
  }
  user.isBlocked = true;
  await user.save();
  res.json({ message: "Người dùng đã bị chặn" });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User không tồn tại");
  }
  user.isBlocked = false;
  await user.save();
  res.json({ message: "Người dùng đã được mở chặn" });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại");
  }

  await user.deleteOne();
  res.json({ message: "Xóa người dùng thành công" });
});

/* -------------------------
   QUẢN LÝ CATEGORIES
   ------------------------- */
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Tên danh mục là bắt buộc");
  }

  const exist = await Category.findOne({ name });
  if (exist) {
    res.status(400);
    throw new Error("Danh mục đã tồn tại");
  }

  const cat = await Category.create({ name, description, image });
  res.status(201).json(cat);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) {
    res.status(404);
    throw new Error("Category không tồn tại");
  }

  cat.name = req.body.name || cat.name;
  cat.description = req.body.description || cat.description;
  cat.image = req.body.image || cat.image;

  await cat.save();
  res.json(cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) {
    res.status(404);
    throw new Error("Category không tồn tại");
  }

  // Kiểm tra trước khi xóa xem có sản phẩm liên quan không
  const linked = await Product.findOne({ category_id: cat._id });
  if (linked) {
    res.status(400);
    throw new Error("Không thể xóa category có sản phẩm liên kết");
  }

  // Xóa category
  await Category.findByIdAndDelete(req.params.id);

  res.json({ message: "Đã xóa Category thành công" });
});

/* -------------------------
   QUẢN LÝ PRODUCTS & PRODUCT_DETAILS
   ------------------------- */
export const getAllProducts = asyncHandler(async (req, res) => {
  // Hỗ trợ query param: ?category=... ?status=... ?search=...
  const { category, status, search } = req.query;
  const filter = {};
  if (category) filter.category_id = category;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const products = await Product.find(filter).populate("category_id", "name");
  res.json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "category_id",
    "name"
  );
  if (!product) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }

  // Nạp thêm các detail (variants)
  const details = await ProductDetail.find({ product_id: product._id });
  res.json({ product, details });
});

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category_id,
    price,
    unit,
    description,
    image,
    stock,
    origin,
    supplier,
  } = req.body;
  if (!name || !price) {
    res.status(400);
    throw new Error("Tên và giá sản phẩm là bắt buộc");
  }

  const prod = await Product.create({
    name,
    category_id,
    price,
    unit,
    description,
    image,
    stock: stock || 0,
    origin,
    supplier,
  });

  res.status(201).json(prod);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const prod = await Product.findById(req.params.id);
  if (!prod) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }
  // cập nhật các trường cơ bản
  const fields = [
    "name",
    "category_id",
    "price",
    "unit",
    "description",
    "image",
    "stock",
    "origin",
    "supplier",
    "status",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) prod[f] = req.body[f];
  });

  await prod.save();
  res.json(prod);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const prod = await Product.findById(req.params.id);
  if (!prod) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }

  // Optional: kiểm tra đơn hàng đã đặt mặt hàng này không
  const ordered = await Order.findOne({ "items.product_id": prod._id });
  if (ordered) {
    res.status(400);
    throw new Error("Không thể xóa sản phẩm đã có trong đơn hàng");
  }

  await prod.remove();
  res.json({ message: "Product đã xóa" });
});

/* Product Detail (variants) */
export const createProductDetail = asyncHandler(async (req, res) => {
  const { product_id, weight, price, stock, description, image } = req.body;
  if (!product_id) {
    res.status(400);
    throw new Error("product_id là bắt buộc");
  }
  const pd = await ProductDetail.create({
    product_id,
    weight,
    price,
    stock,
    description,
    image,
  });
  res.status(201).json(pd);
});

export const updateProductDetail = asyncHandler(async (req, res) => {
  const pd = await ProductDetail.findById(req.params.id);
  if (!pd) {
    res.status(404);
    throw new Error("ProductDetail không tồn tại");
  }
  ["weight", "price", "stock", "description", "image"].forEach((f) => {
    if (req.body[f] !== undefined) pd[f] = req.body[f];
  });
  await pd.save();
  res.json(pd);
});

export const deleteProductDetail = asyncHandler(async (req, res) => {
  const pd = await ProductDetail.findById(req.params.id);
  if (!pd) {
    res.status(404);
    throw new Error("ProductDetail không tồn tại");
  }
  await pd.remove();
  res.json({ message: "Product detail đã xóa" });
});

/* -------------------------
   QUẢN LÝ CARTS & CART_ITEMS
   ------------------------- */
export const getAllCarts = asyncHandler(async (req, res) => {
  // Trả danh sách giỏ hàng, có thể populate user và items
  const carts = await Cart.find().populate("user_id", "username email");
  res.json(carts);
});

export const getCartById = asyncHandler(async (req, res) => {
  const cart = await Cart.findById(req.params.id).populate(
    "user_id",
    "username email"
  );
  if (!cart) {
    res.status(404);
    throw new Error("Cart không tồn tại");
  }
  // lấy cart items riêng
  const items = await CartItem.find({ cart_id: cart._id });
  res.json({ cart, items });
});

export const clearCart = asyncHandler(async (req, res) => {
  // Xoá các cart_item liên quan và cập nhật total_price
  const cart = await Cart.findById(req.params.id);
  if (!cart) {
    res.status(404);
    throw new Error("Cart không tồn tại");
  }
  await CartItem.deleteMany({ cart_id: cart._id });
  cart.total_price = 0;
  cart.status = "EMPTY";
  await cart.save();
  res.json({ message: "Giỏ hàng đã được làm trống" });
});

/* -------------------------
   QUẢN LÝ ORDERS
   ------------------------- */
export const getAllOrders = asyncHandler(async (req, res) => {
  // Hỗ trợ filter ?status=...
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).populate("user_id", "username email");
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user_id",
    "username email"
  );
  if (!order) {
    res.status(404);
    throw new Error("Order không tồn tại");
  }
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order không tồn tại");
  }
  // Ví dụ: req.body.status = "Đang giao" / "Hoàn tất" / "Đã hủy"
  order.status = req.body.status || order.status;
  // Nếu cần update shipping info
  if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
  if (req.body.shipper) order.shipper = req.body.shipper;

  await order.save();
  res.json(order);
});

/* -------------------------
   PAYMENT LOGS
   ------------------------- */
export const getPaymentLogs = asyncHandler(async (req, res) => {
  const logs = await PaymentLog.find()
    .populate("user_id", "username email")
    .populate("order_id", "total_amount status");
  res.json(logs);
});

export const createPaymentLog = asyncHandler(async (req, res) => {
  const {
    order_id,
    user_id,
    payment_method,
    transaction_id,
    amount,
    status,
    note,
  } = req.body;
  if (!order_id || !user_id || !payment_method) {
    res.status(400);
    throw new Error("order_id, user_id, payment_method là bắt buộc");
  }
  const pl = await PaymentLog.create({
    order_id,
    user_id,
    payment_method,
    transaction_id,
    amount,
    status: status || "Chờ xử lý",
    note,
    paidAt: status === "Thành công" ? new Date() : undefined,
  });
  res.status(201).json(pl);
});

/* -------------------------
   REVIEWS
   ------------------------- */
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("user_id", "username fullName")
    .populate("product_id", "name");
  res.json(reviews);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review không tồn tại");
  }
  await review.remove();
  res.json({ message: "Review đã bị xóa" });
});

/* -------------------------
   DASHBOARD STATISTICS
   ------------------------- */
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Tổng số users, products, orders, doanh thu tạm tính (sum(total_amount) của orders đã hoàn tất)
  const usersCount = await User.countDocuments();
  const productsCount = await Product.countDocuments();
  const ordersCount = await Order.countDocuments();
  const revenueAgg = await Order.aggregate([
    { $match: { status: "Hoàn tất" } },
    { $group: { _id: null, total: { $sum: "$total_amount" } } },
  ]);

  const revenue = revenueAgg[0] ? revenueAgg[0].total : 0;

  res.json({
    usersCount,
    productsCount,
    ordersCount,
    revenue,
  });
});

// Lấy thông tin admin đang đăng nhập
export const getAdminProfile = async (req, res) => {
  try {
    if (!req.currentUser) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin admin" });
    }

    res.json({
      _id: req.currentUser._id,
      username: req.currentUser.username,
      email: req.currentUser.email,
      fullName: req.currentUser.fullName,
      role: req.currentUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
