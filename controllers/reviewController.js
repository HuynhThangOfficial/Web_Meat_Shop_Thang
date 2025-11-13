// controllers/reviewController.js
/**
 * controllers/reviewController.js
 *
 * Chứa logic đầy đủ cho Review:
 * - createReview: user thêm review (tùy chọn: verify purchased)
 * - getReviewsByProduct: lấy review theo product (paginate, sort)
 * - getReviewById
 * - getReviewsByUser
 * - updateReview: user chỉnh sửa review (chỉ chỉnh rating/comment)
 * - deleteReview: user xoá review hoặc admin xoá
 * - markHelpful: vote/unvote hữu ích
 * - addReply: thêm reply (admin hoặc user)
 * - moderateReview: admin đổi status visible/hidden/pending
 * - statsForProduct: trả avg rating, count, phân bố sao
 *
 * Mỗi thay đổi sẽ gọi hàm updateProductRating(...) để cập nhật
 * Product.ratings & Product.numReviews.
 *
 * Yêu cầu: models Product, Order, User tồn tại (import phía dưới).
 */

import asyncHandler from "express-async-handler";
import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";

/* ---------------------------
   Helper: cập nhật rating cho product
   - tính lại trung bình và số review (chỉ tính review có status !== "hidden")
   --------------------------- */
const updateProductRating = asyncHandler(async (productId) => {
  const agg = await Review.aggregate([
    {
      $match: {
        product_id: mongoose.Types.ObjectId(productId),
        status: { $ne: "hidden" },
      },
    },
    {
      $group: {
        _id: "$product_id",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const product = await Product.findById(productId);
  if (!product) return;

  if (agg && agg.length > 0) {
    const avg = Math.round(agg[0].avgRating * 100) / 100; // 2 decimal
    product.ratings = avg;
    product.numReviews = agg[0].count;
  } else {
    product.ratings = 0;
    product.numReviews = 0;
  }
  await product.save();
});

/* ---------------------------
   Tạo review
   - body: { product_id, rating, comment, verifyPurchase (bool) }
   - verifyPurchase=true -> kiểm tra user đã mua product (orders) (nếu không: trả lỗi)
   - optional: order_id (nếu muốn liên kết)
   --------------------------- */
export const createReview = asyncHandler(async (req, res) => {
  const userId = req.user._id; // req.user từ middleware protect
  const { product_id, rating, comment, verifyPurchase, order_id } = req.body;

  if (!product_id || !rating) {
    res.status(400);
    throw new Error("Thiếu product_id hoặc rating");
  }

  // kiểm tra product tồn tại
  const product = await Product.findById(product_id);
  if (!product) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại");
  }

  // Nếu yêu cầu verifyPurchase thì kiểm tra order
  if (verifyPurchase) {
    const bought = await Order.findOne({
      user_id: userId,
      "items.product_id": mongoose.Types.ObjectId(product_id),
      status: { $ne: "Đã hủy" }, // order không bị huỷ
    });
    if (!bought) {
      res.status(403);
      throw new Error("Bạn chỉ có thể đánh giá sản phẩm sau khi mua");
    }
  }

  // Kiểm tra user đã review sản phẩm này chưa (cũng có thể cho phép nhiều review, ở đây ta ngăn duplicate)
  const existing = await Review.findOne({ user_id: userId, product_id });
  if (existing) {
    res.status(400);
    throw new Error("Bạn đã đánh giá sản phẩm này rồi");
  }

  // Tạo review
  const review = await Review.create({
    user_id: userId,
    product_id,
    rating,
    comment: comment || "",
    order_id: order_id || null,
    status: "visible", // có thể đặt pending nếu muốn admin duyệt
  });

  // Cập nhật rating product
  await updateProductRating(product_id);

  res.status(201).json({ message: "Đã thêm đánh giá", review });
});

/* ---------------------------
   Lấy review theo product (public)
   Hỗ trợ query:
    - page, limit
    - sort: newest, oldest, rating_desc, rating_asc, helpful
    - status: visible | all (admin can request all)
   --------------------------- */
export const getReviewsByProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;
  const sort = req.query.sort || "newest";
  const status = req.query.status || "visible";

  // build filter
  const filter = { product_id: mongoose.Types.ObjectId(productId) };
  if (status === "visible") filter.status = "visible";

  // build sort
  let sortObj = { createdAt: -1 };
  if (sort === "oldest") sortObj = { createdAt: 1 };
  if (sort === "rating_desc") sortObj = { rating: -1, createdAt: -1 };
  if (sort === "rating_asc") sortObj = { rating: 1, createdAt: -1 };
  if (sort === "helpful") sortObj = { "helpful.length": -1, createdAt: -1 }; // helpful length not persisted; we will sort by helpful count via aggregation

  // If sorting by helpful, do aggregation
  if (sort === "helpful") {
    const agg = await Review.aggregate([
      { $match: filter },
      {
        $addFields: {
          helpfulCount: { $size: { $ifNull: ["$helpful", []] } },
        },
      },
      { $sort: { helpfulCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Populate user info manually
    const populated = await Review.populate(agg, {
      path: "user_id",
      select: "username fullName",
    });
    return res.json({ page, limit, reviews: populated });
  }

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate("user_id", "username fullName")
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  res.json({ page, pages: Math.ceil(total / limit), total, reviews });
});

/* ---------------------------
   Lấy review theo id
   --------------------------- */
export const getReviewById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const review = await Review.findById(id)
    .populate("user_id", "username fullName")
    .populate("product_id", "name");
  if (!review) {
    res.status(404);
    throw new Error("Không tìm thấy review");
  }
  res.json(review);
});

/* ---------------------------
   Lấy review theo user
   --------------------------- */
export const getReviewsByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const reviews = await Review.find({ user_id: userId }).populate(
    "product_id",
    "name"
  );
  res.json(reviews);
});

/* ---------------------------
   Update review (user)
   - user chỉ được sửa review của chính mình
   - fields: rating, comment
   --------------------------- */
export const updateReview = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error("Review không tồn tại");
  }

  // chỉ chủ review hoặc admin mới được update
  if (
    review.user_id.toString() !== userId.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Bạn không có quyền chỉnh sửa review này");
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  // Cập nhật rating product
  await updateProductRating(review.product_id);

  res.json({ message: "Cập nhật review thành công", review });
});

/* ---------------------------
   Xóa review
   - user có thể xóa review của mình
   - admin có thể xóa bất kỳ review nào
   --------------------------- */
export const deleteReview = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error("Review không tồn tại");
  }

  // quyền
  if (
    review.user_id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Bạn không có quyền xóa review này");
  }

  await review.remove();

  // Cập nhật rating product
  await updateProductRating(review.product_id);

  res.json({ message: "Đã xóa review" });
});

/* ---------------------------
   Admin moderation: change status (visible/hidden/pending)
   --------------------------- */
export const moderateReview = asyncHandler(async (req, res) => {
  // only admin should call (protect + adminOnly in route)
  const id = req.params.id;
  const { status } = req.body;
  if (!["visible", "hidden", "pending"].includes(status)) {
    res.status(400);
    throw new Error("Status không hợp lệ");
  }

  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error("Review không tồn tại");
  }

  review.status = status;
  await review.save();

  // update product rating because hidden/pending affect counts
  await updateProductRating(review.product_id);

  res.json({ message: "Đã cập nhật trạng thái review", review });
});

/* ---------------------------
   Mark helpful (vote)
   - toggle: nếu user đã vote thì unvote
   - trả về helpfulCount mới
   --------------------------- */
export const toggleHelpful = asyncHandler(async (req, res) => {
  const id = req.params.id; // review id
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error("Review không tồn tại");
  }

  const idx = review.helpful.findIndex(
    (u) => u.toString() === userId.toString()
  );
  if (idx === -1) {
    review.helpful.push(userId);
  } else {
    review.helpful.splice(idx, 1);
  }

  await review.save();
  res.json({
    message: "Đã cập nhật vote hữu ích",
    helpfulCount: review.helpful.length,
  });
});

/* ---------------------------
   Thêm reply (user hoặc admin)
   - body: { comment }
   - replies lưu user_id + comment
   --------------------------- */
export const addReply = asyncHandler(async (req, res) => {
  const id = req.params.id; // review id
  const userId = req.user._id;
  const { comment } = req.body;
  if (!comment || comment.trim() === "") {
    res.status(400);
    throw new Error("Comment trả lời không được rỗng");
  }

  const review = await Review.findById(id);
  if (!review) {
    res.status(404);
    throw new Error("Review không tồn tại");
  }

  review.replies.push({ user_id: userId, comment });
  await review.save();

  // populate last reply user info for response
  const lastReply = review.replies[review.replies.length - 1];
  const populated = await Review.populate(lastReply, {
    path: "user_id",
    select: "username fullName",
  });

  res.status(201).json({ message: "Đã thêm trả lời", reply: populated });
});

/* ---------------------------
   Stats for product: avg, count, distribution
   --------------------------- */
export const statsForProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const agg = await Review.aggregate([
    {
      $match: {
        product_id: mongoose.Types.ObjectId(productId),
        status: { $ne: "hidden" },
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  // convert to distribution {1: n, 2: n, ...}
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  agg.forEach((g) => {
    distribution[g._id] = g.count;
    total += g.count;
    sum += g._id * g.count;
  });

  const avg = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;

  res.json({ total, avg, distribution });
});
