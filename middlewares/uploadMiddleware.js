// middlewares/uploadMiddleware.js
/**
 * Simple multer setup:
 * - store files to public/uploads/
 * - limit file size (ví dụ 5MB)
 * - filter chỉ cho phép image
 *
 * Trả về req.files hoặc req.file tùy route.
 */

import multer from "multer";
import path from "path";
import fs from "fs";

// Tạo folder nếu chưa có
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tên file: timestamp-originalname
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, Date.now() + "-" + base + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)"), false);
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10); // tối đa 10 ảnh
