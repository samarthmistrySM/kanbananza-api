import { StatusCodes } from "http-status-codes";

import Comment from "../models/Comment.js";
import mongoose from "mongoose";
import Card from "../models/Card.js";
import ApiError from "../utils/ApiError.js";

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
  const userId = req.user.userId;

  if (!text.trim()) {
    return next(new ApiError("comment text is required!", StatusCodes.BAD_REQUEST));
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
      author: userId,
      card: cardId,
    });

    card.comments.push(newComment._id);
    card.save();

    return res.status(StatusCodes.OK).json({ message: "comment created!" });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return next(new ApiError("Invalid comment ID.", StatusCodes.BAD_REQUEST));
  }
  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return next(new ApiError("comment not found!", StatusCodes.NOT_FOUND));
    }

    await comment.deleteOne();
    return res.status(StatusCodes.OK).json({ message: `comment deleted!` });
  } catch (error) {
    next(error);
  }
};

export default { getAllComments, createComment, deleteComment };
