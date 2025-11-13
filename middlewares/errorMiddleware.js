/**
 * middlewares/errorMiddleware.js
 * Middleware xử lý lỗi trung tâm.
 *
 * - notFound: trả 404 cho route không tìm thấy.
 * - errorHandler: bắt lỗi từ controller và trả JSON hợp lệ.
 */

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // stack chỉ hiển thị khi dev
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
