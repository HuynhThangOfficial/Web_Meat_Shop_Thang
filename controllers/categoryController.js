// controllers/categoryController.js
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import ProductDetail from "../models/productDetailModel.js";

/*
  Các hàm điều khiển (controller) cho Category
  ---------------------------------------------
  Mỗi hàm tương ứng với một route (API endpoint)
*/

// 1. Lấy toàn bộ danh mục
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách danh mục", error });
  }
};

// 2. Lấy danh mục theo ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh mục", error });
  }
};

// 3. Lấy danh mục kèm theo danh sách sản phẩm và chi tiết sản phẩm
export const getCategoryWithProducts = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    // Lấy danh sách sản phẩm trong danh mục này
    const products = await Product.find({ category_id: category._id });

    // Lấy chi tiết cho từng sản phẩm (mỗi sản phẩm có nhiều ProductDetail)
    const productDetails = await Promise.all(
      products.map(async (product) => {
        const details = await ProductDetail.find({ product_id: product._id });
        return {
          ...product._doc,
          details,
        };
      })
    );

    res.status(200).json({
      category,
      products: productDetails,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh mục và sản phẩm", error });
  }
};

// 4. Thêm danh mục mới
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, status } = req.body;

    // Kiểm tra danh mục có bị trùng tên không
    const existed = await Category.findOne({ name });
    if (existed) {
      return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    const newCategory = new Category({
      name,
      description,
      image,
      status,
    });

    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo danh mục", error });
  }
};

// 5. Cập nhật danh mục
export const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh mục để cập nhật" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật danh mục", error });
  }
};

// 6. Cập nhật trạng thái (active/inactive)
export const changeCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    category.status = category.status === "active" ? "inactive" : "active";
    await category.save();

    res
      .status(200)
      .json({ message: `Đã đổi trạng thái danh mục thành ${category.status}` });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đổi trạng thái danh mục", error });
  }
};

// 7. Xóa danh mục (nếu không có sản phẩm nào)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Không tìm thấy danh mục" });

    const productCount = await Product.countDocuments({
      category_id: category._id,
    });
    if (productCount > 0) {
      return res.status(400).json({
        message: "Không thể xóa vì danh mục đang chứa sản phẩm",
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Đã xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa danh mục", error });
  }
};

// 8. Lấy các danh mục đang hoạt động (status = active)
export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: "active" });
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh mục đang hoạt động", error });
  }
};

// 9. Tìm kiếm danh mục theo từ khóa (name hoặc description)
export const searchCategory = async (req, res) => {
  try {
    const { keyword } = req.query;
    const results = await Category.find({
      $or: [
        { name: new RegExp(keyword, "i") },
        { description: new RegExp(keyword, "i") },
      ],
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tìm kiếm danh mục", error });
  }
};
