import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email.includes("@")) {
    return next(new ApiError("Email not valid!", StatusCodes.BAD_REQUEST));
  }

  if (password.length <= 8) {
    return next(
      new ApiError(
        "Password must be at least 8 characters!",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ApiError("user not found!", StatusCodes.NOT_FOUND));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(
        new ApiError("password not valid!", StatusCodes.UNAUTHORIZED)
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: "login successful", token });
  } catch (error) {
    next(error);
  }
};

export const signUp = async (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email.includes("@")) {
    return next(new ApiError("Email not valid!", StatusCodes.BAD_REQUEST));
  }

  if (password.length <= 8) {
    return next(
      new ApiError(
        "Password must be at least 8 characters!",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  if (name.length < 3) {
    return next(
      new ApiError(
        "Name must be more than 3 characters!",
        StatusCodes.BAD_REQUEST
      )
    );
  }

  try {
    const user = await User.findOne({ email });

    if (user) {
      return next(
        new ApiError("Email already exist!", StatusCodes.BAD_REQUEST)
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: `${newUser.name} registered!` });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError("user not found!", StatusCodes.NOT_FOUND));
    }

    return res.status(StatusCodes.OK).json({ message: "user found!", user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return res
    .status(StatusCodes.OK)
    .json({ message: "Please remove the token from client storage." });
};

export default { login, signUp, getUser, logout };
