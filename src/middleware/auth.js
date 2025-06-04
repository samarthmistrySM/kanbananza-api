import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

export const authenticateToken = (req, res, next) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return next(new ApiError("Not Authorized!", StatusCodes.UNAUTHORIZED));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
    if (err) {
      return next(new ApiError("Token Expired!", StatusCodes.UNAUTHORIZED));
    }

    req.user = decode;
    next();
  });
};

export const authorizeUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return next(new ApiError("user not found!", StatusCodes.NOT_FOUND));
    }

    next();
  } catch (error) {
    next(error);
  }
};
