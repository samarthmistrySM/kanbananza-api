import { StatusCodes } from "http-status-codes";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
import Board from "../models/Board.js";

export const getRecentActitivities = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);

    const activities = await Activity.find({
      board: { $in: user.boards },
    })
      .populate({ path: "user", populate: { path: "avatar" } })
      .sort({ createdAt: -1 })
      .limit(5);

    if (!activities) {
      return next(new ApiError("Activities not found!", StatusCodes.NOT_FOUND));
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "Activities retrived!", activities });
  } catch (error) {
    next(error);
  }
};

export const getBoardActivities = async (req, res, next) => {
  const { boardId } = req.params;
  const userId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return next(new ApiError("Invalid board ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return next(new ApiError("board not found!", StatusCodes.NOT_FOUND));
    }

    if (board.owner.toString() !== userId.toString()) {
      return next(
        new ApiError(
          "You do not have ownership of this board.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    const activities = await Activity.find({ board: boardId });

    res
      .status(StatusCodes.OK)
      .json({ message: "Activities retrived!", activities });
  } catch (error) {
    next(error);
  }
};

export default { getRecentActitivities, getBoardActivities };
