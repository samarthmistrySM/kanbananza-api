import express from "express";
import invitationController from "../controller/invitation.controller.js";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";

const invitationRouter = express.Router();

invitationRouter.get(
  "/",
  authenticateToken,
  authorizeUser,
  invitationController.getInvitations
);

invitationRouter.post(
  "/send",
  authenticateToken,
  authorizeUser,
  invitationController.sendInvite
);

invitationRouter.post(
  "/:invitationId/accept",
  authenticateToken,
  authorizeUser,
  invitationController.acceptInvitation
);

invitationRouter.post(
  "/:invitationId/reject",
  authenticateToken,
  authorizeUser,
  invitationController.rejectInvitation
);

export default invitationRouter;
