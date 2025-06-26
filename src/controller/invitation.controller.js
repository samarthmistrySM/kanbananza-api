import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Board from "../models/Board.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import fcmService from "../services/fcmService.js";

export const getInvitations = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const invitations = await Invitation.find({ to: userId })
      .populate({
        path: "from",
        select: "name email avatar",
        populate: {
          path: "avatar",
          select: "url",
        },
      })
      .populate({
        path: "board",
        select: "title category",
      });

    res.json({ message: "Invitations retrived!", invitations });
  } catch (error) {
    next(error);
  }
};

export const sendInvite = async (req, res, next) => {
  try {
    const { email, boardId } = req.body;
    const { userId } = req.user;

    let fromUserId = userId;

    const board = await Board.findById(boardId);
    if (!board)
      return next(new ApiError("board not found", StatusCodes.NOT_FOUND));

    const toUser = await User.findOne({ email });

    if (!toUser) {
      return next(new ApiError("User not found!", StatusCodes.NOT_FOUND ));
    }

    const isOwnerOrCollaborator = board.collaborators.some(
      (collabId) => collabId.toString() === toUser._id.toString()
    );

    if (isOwnerOrCollaborator)
      return next(
        new ApiError(
          "You are not allowed to invite users to this board",
          StatusCodes.FORBIDDEN
        )
      );

    const existing = await Invitation.findOne({
      from: fromUserId,
      to: toUser._id,
      board: boardId,
      status: "pending",
    });
    if (existing)
      return next(
        new ApiError(
          "An invitation is already pending for this user",
          StatusCodes.CONFLICT
        )
      );

    const invitation = await Invitation.create({
      from: fromUserId,
      to: toUser._id,
      board: boardId,
    });

    await fcmService.sendNotification(
      toUser.deviceToken,
      `Board Invitation`,
      `You are invited to ${board.title} board`
    );

    await User.findByIdAndUpdate(toUser._id, {
      $addToSet: { invitations: invitation._id },
    });

    res.status(201).json({ message: "Invitation sent", invitation });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.userId;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation)
      return next(new ApiError("Invitation not found", StatusCodes.NOT_FOUND));

    if (invitation.to.toString() !== userId.toString())
      return next(new ApiError("Unauthorized", StatusCodes.UNAUTHORIZED));

    if (invitation.status !== "pending")
      return next(
        new ApiError("Invitation already responded to", StatusCodes.BAD_REQUEST)
      );

    invitation.status = "accepted";
    await invitation.save();

    const boardId = invitation.board;

    await Board.findByIdAndUpdate(boardId, {
      $addToSet: { collaborators: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { boards: boardId },
    });

    res
      .status(StatusCodes.OK)
      .json({ message: "Invitation accepted successfully" });
  } catch (error) {
    next(error);
  }
};

export const rejectInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.userId;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation)
      return next(new ApiError("Invitation not found", StatusCodes.NOT_FOUND));
    if (invitation.to.toString() !== userId.toString())
      return next(new ApiError("Unauthorized", StatusCodes.UNAUTHORIZED));

    if (invitation.status !== "pending")
      return next(
        new ApiError("Invitation already responded to", StatusCodes.BAD_REQUEST)
      );

    invitation.status = "rejected";
    await invitation.save();

    res.status(StatusCodes.OK).json({ message: "Invitation rejected" });
  } catch (error) {
    next(error);
  }
};

export default {
  getInvitations,
  sendInvite,
  acceptInvitation,
  rejectInvitation,
};
