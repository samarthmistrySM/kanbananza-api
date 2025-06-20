import express from "express";
import boardController from "../controller/board.controller.js";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";

const boardsRouter = express.Router();

boardsRouter.get(
  "/get-all",
  authenticateToken,
  authorizeUser,
  boardController.getAllBoards
);

boardsRouter.get(
  "/:boardId",
  authenticateToken,
  authorizeUser,
  boardController.getBoard
);

boardsRouter.get(
  '/category/:category',
  authenticateToken,
  authorizeUser,
  boardController.getCategoryBoards
)

boardsRouter.get(
  "/collaborators/:boardId",
  authenticateToken,
  authorizeUser,
  boardController.getCollaborators
);

boardsRouter.put(
  "/update-board",
  authenticateToken,
  authorizeUser,
  boardController.updateBoard
)

boardsRouter.post(
  "/create-board",
  authenticateToken,
  authorizeUser,
  boardController.createBoard
);

boardsRouter.delete(
  "/:boardId",
  authenticateToken,
  authorizeUser,
  boardController.deleteBoard
);

export default boardsRouter;
