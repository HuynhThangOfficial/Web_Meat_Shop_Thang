// controllers/productDetailController.js
import ProductDetail from "../models/productDetailModel.js";
import Product from "../models/productModel.js";

/*
  Các hàm xử lý logic cho ProductDetail.
  Mỗi hàm tương ứng với 1 route trong routes/productDetailRoutes.js
*/

// 1. Lấy danh sách tất cả ProductDetails
export const getAllProductDetails = async (req, res) => {
  try {
    const productDetails = await ProductDetail.find().populate(
      "product_id",
      "name category"
    );
    res.status(200).json(productDetails);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách ProductDetails", error });
  }
};

// 2. Lấy ProductDetail theo ID
export const getProductDetailById = async (req, res) => {
  try {
    const detail = await ProductDetail.findById(req.params.id).populate(
      "product_id"
    );
    if (!detail) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chi tiết sản phẩm" });
    }
    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết sản phẩm", error });
  }
};

// 3. Lấy ProductDetails theo product_id (tức là tất cả các biến thể của 1 sản phẩm)
export const getDetailsByProductId = async (req, res) => {
  try {
    const details = await ProductDetail.find({
      product_id: req.params.productId,
    });
    if (!details || details.length === 0) {
      return res
        .status(404)
        .json({ message: "Không có chi tiết nào cho sản phẩm này" });
    }
    res.status(200).json(details);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tìm chi tiết theo product_id", error });
  }
};

// 4. Thêm mới ProductDetail
export const createProductDetail = async (req, res) => {
  try {
    const { product_id, weight, price, stock, description, image } = req.body;

    // Kiểm tra product_id có tồn tại không
    const product = await Product.findById(product_id);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để liên kết" });
    }

    const newDetail = new ProductDetail({
      product_id,
      weight,
      price,
      stock,
      description,
      image,
    });

    const savedDetail = await newDetail.save();
    res.status(201).json(savedDetail);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo ProductDetail", error });
  }
};

// 5. Cập nhật ProductDetail
export const updateProductDetail = async (req, res) => {
  try {
    const updated = await ProductDetail.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy ProductDetail để cập nhật" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật ProductDetail", error });
  }
};

// 6. Xóa ProductDetail
export const deleteProductDetail = async (req, res) => {
  try {
    const deleted = await ProductDetail.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy ProductDetail để xóa" });
    }
    res.status(200).json({ message: "Đã xóa ProductDetail thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa ProductDetail", error });
  }
};
