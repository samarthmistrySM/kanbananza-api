import { StatusCodes } from "http-status-codes";
import Avatar from "../models/Avatar.js";
import ApiError from "../utils/ApiError.js";

export const getAllAvatars = async (req, res, next) => {
  try {
    const avatars = await Avatar.find();

    if (avatars.length === 0) {
      return next(
        new ApiError("Sorry, will be available shortly.", StatusCodes.NOT_FOUND)
      );
    }
    res.status(StatusCodes.OK).json({ message: "Avatars retrieved", avatars });
  } catch (error) {
    next(error);
  }
};

export default {getAllAvatars};
