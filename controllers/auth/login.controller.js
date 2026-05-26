/**
 * @file login.controller.js
 * @description Handles user authentication and JWT issuance.
 *
 * Flow:
 *  1. Validate email and password presence
 *  2. Find user by email
 *  3. Compare password with bcrypt
 *  4. Sign a JWT with { id, role } payload
 *  5. Set the token as an httpOnly cookie
 *  6. Return user data (no password)
 *
 * Security notes:
 *  - Both "user not found" and "wrong password" return the same 401 message
 *    to prevent user enumeration attacks.
 *  - Cookie is httpOnly (XSS-safe) and secure in production.
 *
 * Route: POST /api/v1/auth/login
 */

import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../../utils/asyncHandler.utils.js";
import ApiError from "../../utils/errorHandler.utils.js";
import { verifyPassword } from "../../utils/password.utils.js";

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Same message as wrong password — prevents user enumeration
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Sign JWT with user id and role
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  const cookieDays = parseInt(process.env.COOKIE_EXPIRES_IN, 10) || 1;

  // httpOnly prevents JS access; secure ensures HTTPS-only in production
  res.cookie("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   cookieDays * 24 * 60 * 60 * 1000,
  });

  // Also return token in body so frontend can store it in localStorage
  // (needed when cookies are blocked or for Bearer auth on API calls)
  res.status(200).json({
    token,
    _id:          user._id,
    name:         user.name,
    email:        user.email,
    role:         user.role,
    profileImage: user.profileImage,
  });
};

export default asyncHandler(loginController);
