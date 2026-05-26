import jwt from "jsonwebtoken";
import ApiError from "../utils/errorHandler.utils.js";

const verifyToken = (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) return next(new ApiError(401, "Access denied. No token provided."));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, iat, exp }
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError"
      ? "Token has expired. Please log in again."
      : "Invalid token.";
    return next(new ApiError(401, msg));
  }
};

export default verifyToken;
