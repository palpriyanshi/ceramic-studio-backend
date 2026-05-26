import ApiError from "../utils/errorHandler.utils.js";

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      stack:   process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack:   process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export default errorMiddleware;
