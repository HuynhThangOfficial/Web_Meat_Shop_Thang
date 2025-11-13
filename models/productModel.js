// models/productModel.js
/**
 * Product model
 *
 * Fields:
 * - name, slug (tạo tự động), description
 * - category_id -> liên kết Category
 * - price: giá mặc định (có thể override bằng productDetails)
 * - unit: "kg", "cái",...
 * - images: array ảnh (image chính + gallery)
 * - stock: tổng stock (tính hoặc cập nhật)
 * - status: Đang bán / Hết hàng / Đã ẩn (enum)
 * - origin, supplier: metadata
 * - ratings: trung bình rating (cập nhật khi thêm/xóa review)
 */

import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true, unique: true },
    description: { type: String, default: "" },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true }, // base price
    unit: { type: String, default: "kg" },
    images: [{ type: String }], // url or path
    status: {
      type: String,
      enum: ["Đang bán", "Hết hàng", "Đã ẩn"],
      default: "Đang bán",
    },
    stock: { type: Number, default: 0 }, // tổng số lượng có sẵn
    origin: { type: String, default: "" },
    supplier: { type: String, default: "" },
    ratings: { type: Number, default: 0 }, // trung bình rating
    numReviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// trước khi lưu, tạo slug từ tên nếu chưa có hoặc tên thay đổi
productSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
