// models/productDetailModel.js
import mongoose from "mongoose";

/*
  Mỗi ProductDetail lưu các thông tin chi tiết cho từng sản phẩm như:
  - Khối lượng (weight)
  - Giá (price)
  - Tồn kho (stock)
  - Mô tả (description)
  - Hình ảnh (image)
  - Mã sản phẩm (product_id): tham chiếu đến bảng Product
*/

const productDetailSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId, // khóa ngoại đến Product
      ref: "Product",
      required: true,
    },
    weight: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // tự động thêm createdAt và updatedAt
  }
);

// Tạo model ProductDetail
const ProductDetail = mongoose.model("ProductDetail", productDetailSchema);

export default ProductDetail;
