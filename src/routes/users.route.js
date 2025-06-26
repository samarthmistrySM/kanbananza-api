import express from "express";
import userController from "../controller/user.controller.js";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";

const usersRouter = express.Router();

usersRouter.post("/login", userController.login);

usersRouter.post("/signup", userController.signUp);

usersRouter.get(
  "/profile",
  authenticateToken,
  authorizeUser,
  userController.getUser
);

usersRouter.patch(
  "/update-token",
  authenticateToken,
  authorizeUser,
  userController.updateToken
);

usersRouter.patch(
  "/update-avatar/:avatarId",
  authenticateToken,
  authorizeUser,
  userController.updateAvatar
);

usersRouter.put(
  "/update-user",
  authenticateToken,
  authorizeUser,
  userController.updateProfile
);

usersRouter.delete(
  "/logout",
  authenticateToken,
  authorizeUser,
  userController.logout
);

export default usersRouter;
