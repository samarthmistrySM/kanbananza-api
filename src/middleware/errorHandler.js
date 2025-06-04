import { StatusCodes } from "http-status-codes";

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Internal server error";

  res.status(status).json({ message });
};

export default errorHandler;