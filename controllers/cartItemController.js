// controllers/cartItemController.js
import CartItem from "../models/cartItemModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

/**
 *  Lấy danh sách tất cả cart items
 * (Chỉ admin mới có thể xem tất cả)
 */
export const getAllCartItems = async (req, res) => {
  try {
    const cartItems = await CartItem.find()
      .populate("cart_id", "user_id total_price status")
      .populate("product_id", "name price stock");

    res.status(200).json(cartItems);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách cart items", error: err });
  }
};

/**
 * Lấy danh sách cart items theo cart_id
 */
export const getCartItemsByCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    const items = await CartItem.find({ cart_id: cartId }).populate(
      "product_id"
    );

    if (!items || items.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cart items nào." });
    }

    res.status(200).json(items);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy cart items theo cart_id", error: err });
  }
};

/**
 * Thêm 1 sản phẩm vào giỏ hàng (CartItem)
 */
export const addCartItem = async (req, res) => {
  try {
    const { cart_id, product_id, quantity } = req.body;

    // Kiểm tra cart tồn tại
    const cart = await Cart.findById(cart_id);
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng." });

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(product_id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });

    // Nếu item đã tồn tại trong giỏ -> tăng số lượng
    let cartItem = await CartItem.findOne({ cart_id, product_id });
    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = cartItem.price * cartItem.quantity;
      await cartItem.save();
    } else {
      // Nếu chưa có thì tạo mới
      cartItem = new CartItem({
        cart_id,
        product_id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      });
      await cartItem.save();
    }

    // Cập nhật lại tổng giá trị trong giỏ
    const allItems = await CartItem.find({ cart_id });
    const total = allItems.reduce((sum, i) => sum + i.subtotal, 0);
    cart.total_price = total;
    await cart.save();

    res
      .status(201)
      .json({ message: "Đã thêm sản phẩm vào giỏ hàng.", cartItem });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi thêm sản phẩm vào giỏ hàng.", error: err });
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 */
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    const cartItem = await CartItem.findById(cartItemId);
    if (!cartItem)
      return res.status(404).json({ message: "Không tìm thấy cart item." });

    cartItem.quantity = quantity;
    cartItem.subtotal = cartItem.price * quantity;
    await cartItem.save();

    // Cập nhật lại tổng giá trị giỏ hàng
    const cart = await Cart.findById(cartItem.cart_id);
    const allItems = await CartItem.find({ cart_id: cartItem.cart_id });
    cart.total_price = allItems.reduce((sum, i) => sum + i.subtotal, 0);
    await cart.save();

    res
      .status(200)
      .json({ message: "Cập nhật số lượng thành công.", cartItem });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật số lượng sản phẩm.", error: err });
  }
};

/**
 * Xóa một sản phẩm khỏi giỏ hàng
 */
export const deleteCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    const cartItem = await CartItem.findById(cartItemId);
    if (!cartItem)
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm trong giỏ." });

    const cartId = cartItem.cart_id;
    await cartItem.deleteOne();

    // Cập nhật lại tổng giá trị giỏ hàng
    const cart = await Cart.findById(cartId);
    const allItems = await CartItem.find({ cart_id: cartId });
    cart.total_price = allItems.reduce((sum, i) => sum + i.subtotal, 0);
    await cart.save();

    res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa sản phẩm trong giỏ.", error: err });
  }
};

/**
 *  Xóa tất cả sản phẩm trong giỏ hàng (khi user thanh toán hoặc làm trống giỏ)
 */
export const clearCartItems = async (req, res) => {
  try {
    const { cartId } = req.params;
    await CartItem.deleteMany({ cart_id: cartId });

    const cart = await Cart.findById(cartId);
    cart.total_price = 0;
    await cart.save();

    res.status(200).json({ message: "Đã xóa toàn bộ sản phẩm trong giỏ." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa toàn bộ cart items.", error: err });
  }
};
