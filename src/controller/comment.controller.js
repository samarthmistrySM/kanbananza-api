import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import Activity from "../models/Activity.js";
import Comment from "../models/Comment.js";
import Card from "../models/Card.js";
import ApiError from "../utils/ApiError.js";
import { populate } from "dotenv";

export const getAllComments = async (req, res, next) => {
  const { cardId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }
  try {
    const card = await Card.findById(cardId).populate({
      path: "comments",
      populate: {
        path: "author",
        populate: {
          path: "avatar",
        },
      },
    });

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: "comments retrieved!", comments: card.comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  const { text, cardId } = req.body;
  const user = req.user;

  if (!text.trim()) {
    return next(
      new ApiError("comment text is required!", StatusCodes.BAD_REQUEST)
    );
  }

  if (!mongoose.Types.ObjectId.isValid(cardId)) {
    return next(new ApiError("Invalid card ID.", StatusCodes.BAD_REQUEST));
  }

  try {
    const card = await Card.findById(cardId);

    if (!card) {
      return next(new ApiError("card not found!", StatusCodes.NOT_FOUND));
    }

    const newComment = await Comment.create({
      text,
      author: user.userId,
      card: cardId,
      board: card.board,
    });

    card.comments.push(newComment._id);
    card.save();

    await Activity.create({
      type: "COMMENT_ADDED",
      board: card.board,
      column: card.column,
      card: cardId,
      user: user.userId,
      description: `${user.name} added comment on "${card.title}"`,
    });

    return res.status(StatusCodes.OK).json({ message: "comment created!" });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  const { commentId } = req.params;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new ApiError("Invalid comment ID.", StatusCodes.BAD_REQUEST));
  }
  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return next(new ApiError("comment not found!", StatusCodes.NOT_FOUND));
    }

    if (comment.author.toString() !== user.userId.toString()) {
      return next(
        new ApiError(
          "You can not delete this comment.",
          StatusCodes.UNAUTHORIZED
        )
      );
    }

    await Activity.deleteMany({ comment: commentId });

    await comment.deleteOne();
    return res.status(StatusCodes.OK).json({ message: `comment deleted!` });
  } catch (error) {
    next(error);
  }
};

export default { getAllComments, createComment, deleteComment };
