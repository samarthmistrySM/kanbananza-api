import express from "express";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";
import columnController from "../controller/column.controller.js";

const coulmnsRouter = express.Router();

coulmnsRouter.get(
  "/get-all/:boardId",
  authenticateToken,
  authorizeUser,
  columnController.getAllColumns
);

coulmnsRouter.get(
  "/:columnId",
  authenticateToken,
  authorizeUser,
  columnController.getColumn
);

coulmnsRouter.post(
  "/create-column",
  authenticateToken,
  authorizeUser,
  columnController.createColumn
);

coulmnsRouter.delete(
  "/:columnId",
  authenticateToken,
  authorizeUser,
  columnController.deleteColumn
);

export default coulmnsRouter;
