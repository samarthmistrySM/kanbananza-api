import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import Column from "../models/Column.js";
import Board from "../models/Board.js";
import ApiError from "../utils/ApiError.js";

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
    const column = await Column.findById(columnId).populate("cards");

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

export const createColumn = async (req, res, next) => {
  const { title, boardId } = req.body;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    if (!title) {
      return next(new ApiError("column title is required!", StatusCodes.BAD_REQUEST));
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    const isOwner = board.owner.toString() === userId.toString();

    const isCollaborator = board.collaborators.some(
      (id) => id.toString === userId.toString()
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

    board.columns.push(newColumn._id);
    board.save();
    return res
      .status(StatusCodes.CREATED)
      .json({ message: `${newColumn.title} column Created` });
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req, res, next) => {
  const { columnId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return next(new ApiError("Invalid column ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const column = await Column.findById(columnId).populate("board");

    if (!column) {
      return next(new ApiError("column not found!", StatusCodes.NOT_FOUND));
    }

    if (column.board.owner.toString() !== userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await column.deleteOne();

    return res
      .status(StatusCodes.OK)
      .json({ message: `${column.title} column deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

export default { getAllColumns, getColumn, createColumn, deleteColumn };
