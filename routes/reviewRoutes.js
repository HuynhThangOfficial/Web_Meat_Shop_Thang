// routes/reviewRoutes.js
/**
 * Routes cho Reviews
 *
 * Mount ở server: app.use("/api/reviews", reviewRoutes)
 *
 * Các route quan trọng:
 * - POST /api/reviews                       : tạo review (protect)
 * - GET  /api/reviews/product/:productId    : lấy review theo product (public)
 * - GET  /api/reviews/:id                   : lấy review theo id (public)
 * - GET  /api/reviews/user/:userId          : lấy review theo user (protect hoặc admin)
 * - PUT  /api/reviews/:id                   : update review (protect)
 * - DELETE /api/reviews/:id                 : delete (protect)
 * - POST /api/reviews/:id/helpful           : toggle helpful (protect)
 * - POST /api/reviews/:id/reply             : thêm reply (protect)
 * - PUT  /api/reviews/:id/moderate          : admin change status (protect + adminOnly)
 * - GET  /api/reviews/:productId/stats      : stats for product (public)
 */

import express from "express";
import {
  createReview,
  getReviewsByProduct,
  getReviewById,
  getReviewsByUser,
  updateReview,
  deleteReview,
  moderateReview,
  toggleHelpful,
  addReply,
  statsForProduct,
} from "../controllers/reviewController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tạo review (user phải login)
router.post("/", protect, createReview);

// Lấy review theo product (public)
router.get("/product/:productId", getReviewsByProduct);

// Lấy review theo id
router.get("/:id", getReviewById);

// Lấy review theo user
router.get("/user/:userId", protect, getReviewsByUser);

// Update / Delete (user or admin)
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// Vote helpful
router.post("/:id/helpful", protect, toggleHelpful);

// Thêm reply (login)
router.post("/:id/reply", protect, addReply);

// Admin moderation: change status
router.put("/:id/moderate", protect, adminOnly, moderateReview);

// Stats
router.get("/:productId/stats", statsForProduct);

export default router;
