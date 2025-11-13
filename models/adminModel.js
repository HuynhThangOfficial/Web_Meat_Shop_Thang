/**
 * models/adminModel.js
 * Mongoose schema cho collection "admins".
 *
 * Lưu ý:
 * - Password được lưu dạng hash (bcrypt).
 * - role mặc định là "admin" (dễ mở rộng cho role khác).
 */

import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // username không thể trùng
  },
  password: {
    type: String,
    required: true, // sẽ là bcrypt hash
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    default: "admin", // có thể là 'admin', 'superadmin'...
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Nếu cần, có thể thêm method instance để kiểm tra mật khẩu,
// nhưng ở đây ta sẽ so sánh password trong controller bằng bcrypt.

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
