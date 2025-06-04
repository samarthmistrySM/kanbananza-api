import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";

import Board from "../models/Board.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

export const getAllBoards = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId).populate("boards");

    if (!user) {
      return next(
        new ApiError(
          "User not found or not authorized",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: "Boards retrieved!", boards: user.boards });
  } catch (error) {
    next(error);
  }
};

export const getBoard = async (req, res, next) => {
  const { boardId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.BAD_REQUEST));
    }

    if (board.owner.toString() !== userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: "board retrieved!", board });
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req, res, next) => {
  const { title, description } = req.body;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError("user not found!", StatusCodes.NOT_FOUND));
    }

    if (!title) {
      return next(
        new ApiError("Board title is required!", StatusCodes.BAD_REQUEST)
      );
    }

    if (!description) {
      return next(
        new ApiError("Board description is required!", StatusCodes.BAD_REQUEST)
      );
    }

    const newBoard = await Board.create({
      title,
      description,
      owner: userId,
    });

    user.boards.push(newBoard._id);
    user.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ message: `${newBoard.title} board created` });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req, res, next) => {
  const { boardId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.!", StatusCodes.BAD_REQUEST));
  }

  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("Board not found", StatusCodes.NOT_FOUND));
    }

    if (board.owner.toString() !== userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await board.deleteOne();

    return res
      .status(StatusCodes.OK)
      .json({ message: `${board.title} board deleted successfully.` });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

export default { getAllBoards, getBoard, createBoard, deleteBoard };
