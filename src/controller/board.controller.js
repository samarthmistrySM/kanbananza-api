import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";

import Board from "../models/Board.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import Activity from "../models/Activity.js";

const categoryArray = [
  "personal",
  "work",
  "education",
  "marketing",
  "development",
  "other",
];

export const getAllBoards = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId).populate({
      path: "boards",
      options: { sort: { updatedAt: -1 } },
      populate: { path: "collaborators", populate: { path: "avatar" } },
    });

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

    console.log(board.collaborators, userId);

    const isCollaborator = board.collaborators.some(
      (collabId) => collabId.toString() === userId.toString()
    );

    if (!isCollaborator) {
      return next(
        new ApiError(
          "You do not have access of this board.",
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

export const getCategoryBoards = async (req, res, next) => {
  const { category } = req.params;
  const userId = req.user.userId;

  if (!categoryArray.includes(category)) {
    return next(
      new ApiError(
        `Invalid category. Please choose one of: ${categoryArray
          .map((c) => `"${c}"`)
          .join(", ")}.`,
        StatusCodes.BAD_REQUEST
      )
    );
  }

  try {
    const user = await User.findById(userId);

    const allBoards = await Board.find({
      _id: { $in: user.boards },
    });

    const boards = allBoards.filter(
      (board) => board.category === category.toLowerCase()
    );

    if (!boards) {
      return next(
        new ApiError(
          `error finding boards for ${category}!`,
          StatusCodes.NOT_FOUND
        )
      );
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: `boards retrived for ${category}!`, boards });
  } catch (error) {
    next(error);
  }
};

export const getCollaborators = async (req, res, next) => {
  const { boardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board Id", StatusCodes.BAD_REQUEST));
  }

  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    const boardExtended = await board.populate({
      path: "collaborators",
      populate: { path: "avatar" },
    });

    res.status(StatusCodes.OK).json({
      message: "collaborators retrived!",
      collaborators: boardExtended.collaborators,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req, res, next) => {
  const { boardId, title, description } = req.body;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
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

    await board.updateOne({ title, description });

    await Activity.create({
      type: "BOARD_UPDATED",
      user: user.userId,
      board: boardId,
      description: `${user.name} updated the board "${board.title}".`,
    });

    return res.status(StatusCodes.OK).json({ message: "board updated!" });
  } catch (error) {
    return next(error);
  }
};

export const createBoard = async (req, res, next) => {
  const { title, description, category } = req.body;
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

    if (!categoryArray.includes(category.toLowerCase())) {
      return next(
        new ApiError(
          `Invalid category. Please choose one of: ${categoryArray
            .map((c) => `"${c}"`)
            .join(", ")}.`,
          StatusCodes.BAD_REQUEST
        )
      );
    }

    const newBoard = await Board.create({
      title,
      description,
      category: category.toLowerCase(),
      owner: userId,
    });

    newBoard.collaborators.push(userId);
    await newBoard.save();

    await Activity.create({
      type: "BOARD_CREATED",
      user: userId,
      board: newBoard._id,
      description: `${user.name} created the board "${newBoard.title}".`,
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

    await Activity.deleteMany({ board: boardId });

    await board.deleteOne();

    return res
      .status(StatusCodes.OK)
      .json({ message: `${board.title} board deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllBoards,
  getBoard,
  getCategoryBoards,
  getCollaborators,
  updateBoard,
  createBoard,
  deleteBoard,
};
