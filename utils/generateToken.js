/**
 * utils/generateToken.js
 * Tạo JWT token cho admin/user.
 *
 * Dùng được cho cả user và admin. Token chứa payload: { id, role }.
 * Secret lấy từ process.env.JWT_SECRET, thời hạn có thể cấu hình.
 */

import jwt from "jsonwebtoken";

const generateToken = (user) => {
  // user: object chứa _id và role (ví dụ Admin hoặc User)
  const payload = {
    id: user._id,
    role: user.role || "customer",
  };

  // expiresIn có thể đặt ngắn hơn cho admin nếu cần an toàn.
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export default generateToken;
