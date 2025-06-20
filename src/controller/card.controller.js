import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import Card from "../models/Card.js";
import Board from "../models/Board.js";
import Column from "../models/Column.js";
import Activity from "../models/Activity.js";
import ApiError from "../utils/ApiError.js";

export const getCard = async (req, res, next) => {
  const { cardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId).populate({
      path: "assignedTo",
      populate: { path: "avatar" },
    });

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

export const moveCard = async (req, res, next) => {
  const { cardId } = req.params;
  const { targetColumnId, targetOrder } = req.body;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  if (!mongoose.Types.ObjectId.isValid(targetColumnId)) {
    return next(
      new ApiError("Invalid target column ID.", StatusCodes.BAD_REQUEST)
    );
  }

  if (typeof targetOrder !== "number" || targetOrder < 0) {
    return res.status(400).json({ message: "Invalid target order" });
  }

  try {
    const card = await Card.findById(cardId);

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    const oldColumnId = card.column.toString();
    const newColumnId = targetColumnId;
    let activityDescription = "";

    if (oldColumnId !== newColumnId) {
      await Column.findByIdAndUpdate(oldColumnId, {
        $pull: { cards: card._id },
      });

      let newColumn = await Column.findById(newColumnId);

      if (!newColumn) {
        return next(
          new ApiError("target column not found!", StatusCodes.NOT_FOUND)
        );
      }

      newColumn.cards.splice(targetOrder, 0, card._id);
      await newColumn.save();

      card.column = newColumnId;
      card.order = targetOrder;
      await card.save();

      const updatedOldColumn = await Column.findById(oldColumnId).populate(
        "cards"
      );
      for (let i = 0; i < updatedOldColumn.cards.length; i++) {
        await Card.findByIdAndUpdate(updatedOldColumn.cards[i]._id, {
          order: i,
        });
      }

      activityDescription = `${user.name} moved card "${card.title}" to "${newColumn.title}".`;
    } else {
      let column = await Column.findById(oldColumnId);

      if (!column)
        return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));

      const currentIdx = column.cards.findIndex(
        (id) => id.toString() === card._id.toString()
      );

      column.cards.splice(currentIdx, 1);

      column.cards.splice(targetOrder, 0, card._id);
      await column.save();
      card.order = targetOrder;
      await card.save();

      activityDescription = `${user.name} reordered card "${card.title}" in column "${column.title}".`;
    }

    const updatedColumn = await Column.findById(targetColumnId).populate(
      "cards"
    );
    for (let i = 0; i < updatedColumn.cards.length; i++) {
      await Card.findByIdAndUpdate(updatedColumn.cards[i]._id, { order: i });
    }

    await Activity.create({
      type: "CARD_MOVED",
      user: user.userId,
      board: card.board,
      card: cardId,
      column: targetColumnId,
      description: activityDescription,
    });

    return res.status(StatusCodes.OK).json({ message: "card moved!" });
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (req, res, next) => {
  const { cardId } = req.params;
  const { title, description, dueDate, labels } = req.body;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId);

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    let updatedDueDate = dueDate ? dueDate : null;

    await card.updateOne({
      title,
      description,
      dueDate: updatedDueDate,
      labels,
    });

    await Activity.create({
      type: "CARD_UPDATED",
      board: card.board,
      user: user.userId,
      column: card.column,
      card: cardId,
      description: `${user.name} updated the card "${card.title}".`,
    });

    return res.status(StatusCodes.OK).json({ message: "card updated!" });
  } catch (error) {
    next(error);
  }
};

export const createCard = async (req, res, next) => {
  const { title, description, columnId, boardId, dueDate, labels } = req.body;

  const user = req.user;

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

    const card = await Card.create({
      title,
      description,
      column: columnId,
      board: boardId,
      dueDate,
      labels,
    });

    card.assignedTo.push(user.userId);
    card.save();

    column.cards.push(card._id);
    column.save();

    await Activity.create({
      type: "CARD_CREATED",
      user: user.userId,
      board: boardId,
      column: card.column,
      card: card._id,
      description: `${user.name} created the card "${title}".`,
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: `${card.title} Card created!` });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req, res, next) => {
  const { cardId } = req.params;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId).populate("board");

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    if (card.board.owner.toString() !== user.userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await Activity.deleteMany({ card: cardId });

    await card.deleteOne();

    await Activity.create({
      type: "CARD_DELETED",
      board: card.board,
      user: user.userId,
      description: `${user.name} deleted the card "${card.title}"`,
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: `${card.title} card deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

export const assignTask = async (req, res, next) => {
  const { cardId } = req.params;
  const { assigneeId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
    return next(new ApiError("Invalid assignee ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId);
    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    const board = await Board.findById(card.board);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    if (card.assignedTo.map(String).includes(assigneeId.toString())) {
      return next(
        new ApiError(
          "assignee has already been added to this card!",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    if (!board.collaborators.map(String).includes(assigneeId.toString())) {
      return next(
        new ApiError(
          "assignee not related to this board!",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    card.assignedTo.push(assigneeId);
    await card.save();
    await board.save();

    res.status(StatusCodes.OK).json({ message: "assignee added to card!" });
  } catch (error) {
    next(error);
  }
};

export default {
  getCard,
  updateCard,
  createCard,
  deleteCard,
  moveCard,
  assignTask,
};
