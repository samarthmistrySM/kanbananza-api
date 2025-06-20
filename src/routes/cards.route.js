import express from "express";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";
import cardController from "../controller/card.controller.js";

const cardsRouter = express.Router();

cardsRouter.get(
  "/:cardId",
  authenticateToken,
  authorizeUser,
  cardController.getCard
);

cardsRouter.patch(
  "/move-card/:cardId",
  authenticateToken,
  authorizeUser,
  cardController.moveCard
);

cardsRouter.patch(
  "/add-assignee/:cardId",
  authenticateToken,
  authorizeUser,
  cardController.assignTask
)

cardsRouter.put(
  "/update-card/:cardId",
  authenticateToken,
  authorizeUser,
  cardController.updateCard
);

cardsRouter.post(
  "/create-card",
  authenticateToken,
  authorizeUser,
  cardController.createCard
);

cardsRouter.delete(
  "/:cardId",
  authenticateToken,
  authorizeUser,
  cardController.deleteCard
);

export default cardsRouter;
