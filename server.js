import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import productDetailRoutes from "./routes/productDetailRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import cartItemRoutes from "./routes/cartItemRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentLogRoutes from "./routes/paymentLogRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static("public"));

// Mount routes product
app.use("/api/products", productRoutes);

// productDetail
app.use("/api/productDetails", productDetailRoutes);

// Mount routes admin
app.use("/api/admin", adminRoutes);

// category
app.use("/api/categories", categoryRoutes);

// cart
app.use("/api/carts", cartRoutes);

// cartItem
app.use("/api/cartItems", cartItemRoutes);

//order
app.use("/api/orders", orderRoutes);

// paymentLog
app.use("/api/paymentLogs", paymentLogRoutes);

// review
app.use("/api/reviews", reviewRoutes);

// user
app.use("/api/users", userRoutes);

// Gửi file index.html khi truy cập trang chủ
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
