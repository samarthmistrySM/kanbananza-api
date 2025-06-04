import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import Card from "../models/Card.js";
import Board from "../models/Board.js";
import Column from "../models/Column.js";
import ApiError from "../utils/ApiError.js";

export const getCard = async (req, res, next) => {
  const { cardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId);

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: "card retrieved!", card });
  } catch (error) {
    next(error);
  }
};

export const createCard = async (req, res, next) => {
  const { title, description, columnId, boardId, dueDate, labelListString } =
    req.body;

  try {
    if (!title) {
      return next(new ApiError("title is required!", StatusCodes.BAD_REQUEST));
    }

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
    }

    if (!mongoose.Types.ObjectId.isValid(columnId)) {
      return next(new ApiError("Invalid column ID.", StatusCodes.BAD_REQUEST));
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    const column = await Column.findById(columnId);

    if (!column) {
      return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));
    }

    const labels = labelListString.split(",").map((label) => label.trim());

    const card = await Card.create({
      title,
      description,
      column: columnId,
      board: boardId,
      dueDate,
      labels,
    });

    column.cards.push(card._id);
    column.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ message: `${card.title} Card created!` });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId).populate("board");

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    if (card.board.owner.toString() !== userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await card.deleteOne();

    return res
      .status(StatusCodes.OK)
      .json({ message: `${card.title} card deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

export default { getCard, createCard, deleteCard };
