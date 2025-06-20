import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import User from "../models/User.js";
import Column from "../models/Column.js";
import Activity from "../models/Activity.js";
import Board from "../models/Board.js";
import ApiError from "../utils/ApiError.js";
import { populate } from "dotenv";

export const getAllColumns = async (req, res, next) => {
  const { boardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    const extendedBoard = await board.populate("columns");

    return res
      .status(StatusCodes.OK)
      .json({ message: "columns fetched!", columns: extendedBoard.columns });
  } catch (error) {
    next(error);
  }
};

export const getColumn = async (req, res, next) => {
  const { columnId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return next(new ApiError("Invalid column ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const column = await Column.findById(columnId).populate({
      path: "cards",
      populate: { path: "assignedTo", populate: { path: "avatar" } },
    });

    if (!column) {
      return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: "column retrieved!", column });
  } catch (error) {
    next(error);
  }
};

export const moveColumn = async (req, res, next) => {
  const { columnId } = req.params;
  const { targetOrder, boardId } = req.body;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return next(new ApiError("Invalid column ID.", StatusCodes.BAD_REQUEST));
  }

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
  }

  if (typeof targetOrder !== "number" || targetOrder < 0) {
    return next(new ApiError("Invalid target order!", StatusCodes.BAD_REQUEST));
  }

  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    if (board.owner.toString() !== user.userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    const columns = await Column.find({ board: boardId }).sort("order").exec();
    const column = columns.find((col) => col._id.toString() === columnId);

    if (!column) {
      return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));
    }

    columns.splice(columns.indexOf(column), 1);
    columns.splice(targetOrder, 0, column);

    await Promise.all(
      columns.map((col, idx) => {
        col.order = idx;
        return col.save();
      })
    );

    await Activity.create({
      type: "COLUMN_UPDATED",
      user: user.userId,
      board: boardId,
      column: columnId,
      description: `${user.name} moved the column "${
        column.title
      }" to position ${targetOrder + 1}.`,
    });

    return res.status(StatusCodes.OK).json({ message: "column moved!" });
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req, res, next) => {
  const { columnId } = req.params;
  const { title } = req.body;
  const { userId } = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return next(new ApiError("Invalid column ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError("user not found!", StatusCodes.NOT_FOUND));
    }

    const column = await Column.findById(columnId);

    if (!column) {
      return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));
    }

    if (column.board.toString() !== userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await column.updateOne({ title });

    await Activity.create({
      type: "COLUMN_UPDATED",
      user: userId,
      board: column.board,
      column: columnId,
      description: `${user.name} updated the column "${column.title}" to "${title}".`,
    });

    return res.status(StatusCodes.OK).json({ message: "Column updated!" });
  } catch (error) {
    next(error);
  }
};

export const createColumn = async (req, res, next) => {
  const { title, boardId } = req.body;
  const user = req.user;
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    if (!title) {
      return next(
        new ApiError("column title is required!", StatusCodes.BAD_REQUEST)
      );
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    const isOwner = board.owner.toString() === user.userId.toString();

    const isCollaborator = board.collaborators.some(
      (id) => id.toString === user.userId.toString()
    );

    if (!isOwner && !isCollaborator) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    const newColumn = await Column.create({
      title,
      board: boardId,
    });

    newColumn.save();

    board.columns.push(newColumn._id);
    board.save();

    await Activity.create({
      type: "COLUMN_CREATED",
      user: user.userId,
      board: boardId,
      column: newColumn._id,
      description: `${user.name} created the column "${title}".`,
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: `${newColumn.title} column Created` });
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req, res, next) => {
  const { columnId } = req.params;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return next(new ApiError("Invalid column ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const column = await Column.findById(columnId).populate("board");

    if (!column) {
      return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));
    }

    if (column.board.owner.toString() !== user.userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await Activity.deleteMany({ column: columnId });

    await column.deleteOne();

    await Activity.create({
      type: "COLUMN_DELETED",
      user: user.userId,
      board: column.board._id,
      description: `${user.name} deleted the column "${column.title}".`,
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: `${column.title} column deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllColumns,
  getColumn,
  moveColumn,
  updateColumn,
  createColumn,
  deleteColumn,
};
