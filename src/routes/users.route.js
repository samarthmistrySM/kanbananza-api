import express from "express";
import userController from "../controller/user.controller.js";
import { authenticateToken, authorizeUser } from "../middleware/auth.js";

const usersRouter = express.Router();

usersRouter.get(
  "/profile",
  authenticateToken,
  authorizeUser,
  userController.getUser
);
usersRouter.post("/login", userController.login);
usersRouter.post("/signup", userController.signUp);
usersRouter.delete(
  "/logout",
  authenticateToken,
  authorizeUser,
  userController.logout
);

export default usersRouter;
