// controllers/productController.js
/**
 * Product controller - toàn bộ chức năng cho products:
 * - Public:
 *    getProducts (filter, search, pagination, sort)
 *    getProductById (populate category + details + reviews)
 * - Admin (protected):
 *    createProduct, updateProduct, deleteProduct
 *    createProductDetail, updateProductDetail, deleteProductDetail
 *    uploadImages (single/multiple)
 *    bulkImport (CSV)
 *    adjustStock (tăng/giảm thủ công)
 *
 * NOTE:
 * - Khi xóa product, controller sẽ kiểm tra order liên quan để tránh xóa sản phẩm đã đặt.
 * - Khi thêm/xóa review — update rating và numReviews (có thể gọi từ reviewController).
 */

import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import ProductDetail from "../models/productDetailModel.js";
import Category from "../models/categoryModel.js";
import Review from "../models/reviewModel.js";
import Order from "../models/orderModel.js";
import { parseCSV } from "../utils/csvParser.js";
import fs from "fs";
import path from "path";

/* ---------------------------
   PUBLIC: Lấy danh sách sản phẩm
   - Hỗ trợ filter: category, status
   - Tìm kiếm: name
   - priceMin, priceMax
   - sort: price_asc, price_desc, newest, rating
   - pagination: page, limit
   --------------------------- */
export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 12, 100); // giới hạn tối đa 100
  const skip = (page - 1) * limit;

  const { category, status, search, priceMin, priceMax, sort } = req.query;

  const filter = {};
  if (category) filter.category_id = category;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }

  // build sort object
  let sortObj = { createdAt: -1 }; // default newest
  if (sort === "price_asc") sortObj = { price: 1 };
  if (sort === "price_desc") sortObj = { price: -1 };
  if (sort === "rating") sortObj = { ratings: -1 };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category_id", "name")
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  res.json({
    page,
    pages: Math.ceil(total / limit),
    total,
    products,
  });
});

/* ---------------------------
   PUBLIC: Lấy chi tiết 1 product
   - populate category
   - load product details (variants)
   - load reviews (có thể paginate nếu nhiều)
   --------------------------- */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "category_id",
    "name description"
  );
  if (!product) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }

  const details = await ProductDetail.find({ product_id: product._id });
  // Lấy reviews (tối đa 50, có thể paginate)
  const reviews = await Review.find({ product_id: product._id })
    .populate("user_id", "username fullName")
    .limit(50)
    .sort({ createdAt: -1 });

  res.json({ product, details, reviews });
});

/* ---------------------------
   ADMIN: Tạo product mới
   - body: name, category_id, price, unit, description, images (array or single), stock, origin, supplier
   - nếu gửi images bằng multipart/form-data -> xử lý qua upload middleware
   --------------------------- */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category_id,
    price,
    unit,
    description,
    stock,
    origin,
    supplier,
  } = req.body;

  if (!name || !price || !category_id) {
    res.status(400);
    throw new Error("Thiếu trường bắt buộc: name, price, category_id");
  }

  // đảm bảo category tồn tại
  const category = await Category.findById(category_id);
  if (!category) {
    res.status(400);
    throw new Error("Category không tồn tại");
  }

  const product = new Product({
    name,
    category_id,
    price,
    unit: unit || "kg",
    description: description || "",
    images: req.body.images
      ? Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images]
      : [],
    stock: Number(stock) || 0,
    origin: origin || "",
    supplier: supplier || "",
  });

  await product.save();
  res.status(201).json(product);
});

/* ---------------------------
   ADMIN: Update product
   - cập nhật các trường cho phép
   --------------------------- */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }

  const fields = [
    "name",
    "price",
    "unit",
    "description",
    "status",
    "origin",
    "supplier",
    "stock",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  // images nếu gửi mới (override hoặc push tuỳ bạn)
  if (req.body.images) {
    product.images = Array.isArray(req.body.images)
      ? req.body.images
      : [req.body.images];
  }

  await product.save();
  res.json(product);
});

/* ---------------------------
   ADMIN: Delete product
   - Kiểm tra: nếu product xuất hiện trong orders -> không xóa
   - (Bạn có thể chuyển sang soft-delete nếu muốn)
   --------------------------- */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }

  // kiểm tra trong orders
  const hasOrdered = await Order.findOne({ "items.product_id": product._id });
  if (hasOrdered) {
    res.status(400);
    throw new Error("Không thể xóa sản phẩm đã từng xuất hiện trong đơn hàng");
  }

  // xóa product details trước (nếu có)
  await ProductDetail.deleteMany({ product_id: product._id });

  await product.remove();
  res.json({ message: "Product đã xóa" });
});

/* ---------------------------
   Product details (variants) CRUD
   - createProductDetail, updateProductDetail, deleteProductDetail
   - Khi chỉnh stock variant, nên cập nhật stock tổng product stock (tùy strategy)
   --------------------------- */
export const createProductDetail = asyncHandler(async (req, res) => {
  const { product_id, sku, variant, price, stock, image } = req.body;
  if (!product_id || !price) {
    res.status(400);
    throw new Error("product_id và price là bắt buộc");
  }
  const product = await Product.findById(product_id);
  if (!product) {
    res.status(404);
    throw new Error("Product không tồn tại");
  }

  const pd = new ProductDetail({
    product_id,
    sku: sku || "",
    variant: variant || "",
    price,
    stock: Number(stock) || 0,
    image: image || "",
  });

  await pd.save();

  // Option: cập nhật tổng stock product = tổng stock của các detail
  const totalStock = await ProductDetail.aggregate([
    { $match: { product_id: product._id } },
    { $group: { _id: "$product_id", sumStock: { $sum: "$stock" } } },
  ]);
  product.stock = totalStock[0] ? totalStock[0].sumStock : product.stock;
  await product.save();

  res.status(201).json(pd);
});

export const updateProductDetail = asyncHandler(async (req, res) => {
  const pd = await ProductDetail.findById(req.params.id);
  if (!pd) {
    res.status(404);
    throw new Error("ProductDetail không tồn tại");
  }
  ["sku", "variant", "price", "stock", "image"].forEach((f) => {
    if (req.body[f] !== undefined) pd[f] = req.body[f];
  });

  await pd.save();

  // cập nhật tổng stock product
  const product = await Product.findById(pd.product_id);
  const totalStock = await ProductDetail.aggregate([
    { $match: { product_id: product._id } },
    { $group: { _id: "$product_id", sumStock: { $sum: "$stock" } } },
  ]);
  product.stock = totalStock[0] ? totalStock[0].sumStock : product.stock;
  await product.save();

  res.json(pd);
});

export const deleteProductDetail = asyncHandler(async (req, res) => {
  const pd = await ProductDetail.findById(req.params.id);
  if (!pd) {
    res.status(404);
    throw new Error("ProductDetail không tồn tại");
  }

  // Kiểm tra varaint đã được đặt trong order chưa
  const ordered = await Order.findOne({ "items.product_id": pd.product_id });
  if (ordered) {
    // Lưu ý: kiểm tra variant cụ thể phụ thuộc cách lưu item trong order (nếu lưu productDetail ID)
    // Ở đây check chung product_id để tránh xóa variant nếu sản phẩm đã được đặt.
    res.status(400);
    throw new Error(
      "Không thể xóa variant của sản phẩm đã từng xuất hiện trong đơn hàng"
    );
  }

  const productId = pd.product_id;
  await pd.remove();

  // cập nhật tổng stock product
  const product = await Product.findById(productId);
  const totalStock = await ProductDetail.aggregate([
    { $match: { product_id: product._id } },
    { $group: { _id: "$product_id", sumStock: { $sum: "$stock" } } },
  ]);
  product.stock = totalStock[0] ? totalStock[0].sumStock : product.stock;
  await product.save();

  res.json({ message: "ProductDetail đã xóa" });
});

/* ---------------------------
   Upload images (single / multiple)
   - route sử dụng middlewares uploadSingle / uploadMultiple
   - trả về paths (relative) để lưu vào product.images
   --------------------------- */
export const uploadProductImages = asyncHandler(async (req, res) => {
  // req.files (array) hoặc req.file (single)
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    res.status(400);
    throw new Error("Không có file được upload");
  }

  // chuyển file path thành url/public path (ví dụ '/uploads/filename')
  const urls = files.map((f) => {
    const basename = path.basename(f.path);
    return `/uploads/${basename}`;
  });

  res.json({ uploaded: urls });
});

/* ---------------------------
   Bulk import products từ CSV
   - dùng uploadSingle để nhận file CSV (key: file)
   - CSV phải có header tương ứng (name,category,price,unit,description,stock,origin,supplier,image)
   --------------------------- */
export const bulkImportCSV = asyncHandler(async (req, res) => {
  // req.file.path
  if (!req.file) {
    res.status(400);
    throw new Error("Vui lòng upload file CSV");
  }

  const buffer = fs.readFileSync(req.file.path);
  const records = parseCSV(buffer); // mảng object

  const created = [];
  const errors = [];

  for (const row of records) {
    try {
      // tìm hoặc tạo category
      let category;
      if (row.category) {
        category = await Category.findOne({ name: row.category });
        if (!category) {
          category = await Category.create({
            name: row.category,
            description: "",
          });
        }
      } else {
        throw new Error("Thiếu category");
      }

      const prod = new Product({
        name: row.name,
        category_id: category._id,
        price: Number(row.price) || 0,
        unit: row.unit || "kg",
        description: row.description || "",
        images: row.image ? [row.image] : [],
        stock: Number(row.stock) || 0,
        origin: row.origin || "",
        supplier: row.supplier || "",
      });

      await prod.save();
      created.push(prod);
    } catch (err) {
      errors.push({ row, error: err.message });
    }
  }

  // xóa file CSV tạm
  fs.unlinkSync(req.file.path);

  res.json({ createdCount: created.length, errors });
});

/* ---------------------------
   Adjust stock manual (admin)
   - type: increment | decrement | set
   --------------------------- */
export const adjustStock = asyncHandler(async (req, res) => {
  const { type, amount, productDetailId } = req.body; // nếu cung cấp productDetailId -> update variant
  const amountNum = Number(amount);
  if (!["increment", "decrement", "set"].includes(type) || isNaN(amountNum)) {
    res.status(400);
    throw new Error("Tham số type hoặc amount không hợp lệ");
  }

  if (productDetailId) {
    const pd = await ProductDetail.findById(productDetailId);
    if (!pd) {
      res.status(404);
      throw new Error("ProductDetail không tồn tại");
    }
    if (type === "set") pd.stock = amountNum;
    if (type === "increment") pd.stock += amountNum;
    if (type === "decrement") pd.stock = Math.max(0, pd.stock - amountNum);
    await pd.save();

    // Cập nhật tổng stock product
    const product = await Product.findById(pd.product_id);
    const totalStock = await ProductDetail.aggregate([
      { $match: { product_id: product._id } },
      { $group: { _id: "$product_id", sumStock: { $sum: "$stock" } } },
    ]);
    product.stock = totalStock[0] ? totalStock[0].sumStock : product.stock;
    await product.save();

    return res.json({
      message: "Đã cập nhật stock variant",
      pd,
      productStock: product.stock,
    });
  } else {
    // cập nhật product.stock trực tiếp
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product không tồn tại");
    }
    if (type === "set") product.stock = amountNum;
    if (type === "increment") product.stock += amountNum;
    if (type === "decrement")
      product.stock = Math.max(0, product.stock - amountNum);
    await product.save();
    res.json({ message: "Đã cập nhật stock product", product });
  }
});

/* ---------------------------
   Helper: update rating khi review thay đổi
   - Gọi hàm này sau khi thêm/xóa review
   --------------------------- */
export const updateProductRating = asyncHandler(async (productId) => {
  const agg = await Review.aggregate([
    { $match: { product_id: productId } },
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

  if (agg && agg[0]) {
    product.ratings =
      Math.round((agg[0].avgRating + Number.EPSILON) * 100) / 100; // 2 decimals
    product.numReviews = agg[0].count;
  } else {
    product.ratings = 0;
    product.numReviews = 0;
  }
  await product.save();
});

/* ---------------------------
   OnOrder: giảm stock khi tạo order (nên gọi từ orderController khi order thành công)
   - orderItems: [{ product_id, productDetailId(opt), quantity }]
   - strategy: nếu productDetailId tồn tại -> giảm variant.stock và tổng product.stock
               else -> giảm product.stock trực tiếp
   --------------------------- */
export const reduceStockOnOrder = asyncHandler(async (orderItems) => {
  for (const item of orderItems) {
    if (item.productDetailId) {
      const pd = await ProductDetail.findById(item.productDetailId);
      if (!pd) continue;
      pd.stock = Math.max(0, pd.stock - item.quantity);
      await pd.save();

      // cập nhật tổng product stock
      const product = await Product.findById(pd.product_id);
      const totalStock = await ProductDetail.aggregate([
        { $match: { product_id: product._id } },
        { $group: { _id: "$product_id", sumStock: { $sum: "$stock" } } },
      ]);
      product.stock = totalStock[0] ? totalStock[0].sumStock : product.stock;
      await product.save();
    } else {
      const product = await Product.findById(item.product_id);
      if (!product) continue;
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
    }
  }
});
