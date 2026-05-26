/**
 * @file user.controller.js
 * @description All user controllers — own profile and admin user CRUD.
 *
 * Own profile (any authenticated user):
 *  - getMe, updateMe, updateAvatar, changePassword, deleteMe
 *
 * Admin (verifyToken + isAdmin):
 *  - getAllUsers, getUserById, updateUserById, deleteUserById
 */

import User from "../../models/user.model.js";
import asyncHandler from "../../utils/asyncHandler.utils.js";
import ApiError from "../../utils/errorHandler.utils.js";
import uploadOnCloudinary from "../../utils/cloudinary.utils.js";
import { hashPassword, verifyPassword } from "../../utils/password.utils.js";
import { getPaginationParams, paginate } from "../../utils/pagination.utils.js";

// ─── OWN PROFILE ─────────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(user);
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (req.body.role || req.body.password) {
    throw new ApiError(400, "Use dedicated endpoints to change password or role");
  }
  const updated = await User.findByIdAndUpdate(
    req.user.id, { $set: { name, email } }, { new: true, runValidators: true }
  ).select("-password");
  if (!updated) throw new ApiError(404, "User not found");
  res.status(200).json(updated);
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) throw new ApiError(400, "No image file provided");
  const uploaded = await uploadOnCloudinary(localPath);
  if (!uploaded) throw new ApiError(500, "Image upload failed");
  const updated = await User.findByIdAndUpdate(
    req.user.id, { $set: { profileImage: uploaded.secure_url } }, { new: true }
  ).select("-password");
  res.status(200).json(updated);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "currentPassword and newPassword are required");
  }
  if (newPassword.length < 6) throw new ApiError(400, "New password must be at least 6 characters");

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");
  if (!(await verifyPassword(currentPassword, user.password))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  user.password = await hashPassword(newPassword);
  await user.save();
  res.status(200).json({ message: "Password updated successfully" });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.clearCookie("token");
  res.status(200).json({ message: "Account deleted successfully" });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { role, search } = req.query;

  const filter = {};
  if (role)   filter.role = role;
  if (search) filter.name = { $regex: search, $options: "i" };

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.status(200).json(paginate(users, total, page, limit, "users"));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").lean();
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(user);
});

export const updateUserById = asyncHandler(async (req, res) => {
  if (req.body.password) throw new ApiError(400, "Cannot update password through this endpoint");
  const updated = await User.findByIdAndUpdate(
    req.params.id, { $set: req.body }, { new: true, runValidators: true }
  ).select("-password");
  if (!updated) throw new ApiError(404, "User not found");
  res.status(200).json(updated);
});

export const deleteUserById = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(400, "Admins cannot delete their own account from this endpoint");
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ message: "User deleted successfully" });
});
