// models/reviewModel.js
/**
 * Review model
 *
 * Schema lưu đánh giá sản phẩm:
 * - user_id: người đánh giá (ref User)
 * - product_id: sản phẩm được đánh giá (ref Product)
 * - rating: số sao (1..5)
 * - comment: nội dung đánh giá
 * - helpful: mảng user_id đã vote hữu ích
 * - replies: mảng trả lời (nested) { user_id, comment, createdAt }
 * - status: moderation status (visible, hidden, pending)
 *
 * timestamps: createdAt, updatedAt
 */

import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: { type: String, required: true },
  },
  { timestamps: true } // createdAt for reply
);

const reviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who marked helpful
    replies: [replySchema],
    status: {
      type: String,
      enum: ["visible", "hidden", "pending"],
      default: "visible",
    },
    // optional: liên kết tới order (nếu muốn chứng minh đã mua)
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes: tìm kiếm text trên comment, và nhanh lookup product
reviewSchema.index({ product_id: 1, rating: -1 });
reviewSchema.index({ comment: "text" });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
