import ApiError from "../utils/errorHandler.utils.js";

const isAdmin = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    return next(new ApiError(403, "Access denied. Admins only."));
  }
  next();
};

export default isAdmin;
