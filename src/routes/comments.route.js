import express from "express";
import commentController from "../controller/comment.controller.js";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";
const commentsRouter = express.Router();

commentsRouter.get(
  "/:cardId",
  authenticateToken,
  authorizeUser,
  commentController.getAllComments
);

commentsRouter.post(
  "/create-comment",
  authenticateToken,
  authorizeUser,
  commentController.createComment
);

commentsRouter.delete(
  "/:commentId",
  authenticateToken,
  authorizeUser,
  commentController.deleteComment
);

export default commentsRouter;
