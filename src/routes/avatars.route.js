import express from "express";
import avatarController from "../controller/avatar.controller.js";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";

const avatarsRouter = express.Router();

avatarsRouter.get(
  "/get-all",
  authenticateToken,
  authorizeUser,
  avatarController.getAllAvatars
);

export default avatarsRouter;
