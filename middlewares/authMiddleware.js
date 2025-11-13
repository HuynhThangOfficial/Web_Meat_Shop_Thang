/**
 * middlewares/authMiddleware.js
 * Middleware xác thực JWT và phân quyền admin.
 *
 * - protect: kiểm tra token hợp lệ, gán req.currentUser = { id, role }.
 * - adminOnly: kiểm tra req.currentUser.role === 'admin' (hoặc superadmin).
 *
 * Cách dùng:
 *   router.get("/admin-only", protect, adminOnly, handler)
 */

import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";

// ✅ Middleware xác thực JWT
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // decoded chứa { id, role }
      // Tìm user hoặc admin tương ứng
      if (decoded.role === "admin") {
        req.currentUser = await Admin.findById(decoded.id).select("-password");
      } else {
        req.currentUser = await User.findById(decoded.id).select("-password");
      }

      if (!req.currentUser) {
        return res
          .status(401)
          .json({ message: "Unauthorized: user/admin not found" });
      }

      // ✅ Thêm dòng này để tương thích với các controller đang dùng req.user
      req.user = req.currentUser;

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có token, truy cập bị từ chối" });
  }
});

// ✅ Middleware chỉ cho phép admin
export const adminOnly = (req, res, next) => {
  if (!req.currentUser) {
    return res.status(401).json({ message: "Unauthorized: no user info" });
  }

  if (req.currentUser.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin access only" });
  }

  next();
};
