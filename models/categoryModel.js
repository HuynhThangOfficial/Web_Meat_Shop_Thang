// models/categoryModel.js
import mongoose from "mongoose";

/*
  Mô tả bảng Category:
  ---------------------
  - name: Tên danh mục (VD: "Thịt tươi", "Hải sản", ...)
  - description: Mô tả ngắn cho danh mục
  - image: Hình ảnh đại diện cho danh mục
  - status: Trạng thái danh mục (active / inactive)
  - createdAt: Ngày tạo danh mục
*/

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên danh mục không được để trống"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // tự động thêm createdAt và updatedAt
  }
);

// Liên kết ngược: Category có thể chứa nhiều Product
categorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "category_id", // trùng với field trong bảng Product
});

// Cho phép hiển thị virtual field khi chuyển thành JSON
categorySchema.set("toObject", { virtuals: true });
categorySchema.set("toJSON", { virtuals: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
