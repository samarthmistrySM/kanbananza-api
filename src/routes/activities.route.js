import express from "express";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";
import activityControlller from "../controller/activity.controller.js";
const activitiesRouter = express.Router();

activitiesRouter.get(
  "/",
  authenticateToken,
  authorizeUser,
  activityControlller.getRecentActitivities
);

activitiesRouter.get(
  "/:boardId",
  authenticateToken,
  authorizeUser,
  activityControlller.getBoardActivities
);

export default activitiesRouter;
