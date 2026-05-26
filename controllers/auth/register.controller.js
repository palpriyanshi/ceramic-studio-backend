/**
 * @file register.controller.js
 * @description Handles new user registration.
 *
 * Flow:
 *  1. Validate required fields (name, email, password)
 *  2. Check for duplicate email
 *  3. Hash password with bcrypt (10 rounds)
 *  4. Upload default avatar to Cloudinary
 *  5. Create user in MongoDB
 *  6. Return user data (no password)
 *  7. Send welcome email asynchronously (fire-and-forget)
 *
 * Route: POST /api/v1/auth/register
 */

import User from "../../models/user.model.js";
import asyncHandler from "../../utils/asyncHandler.utils.js";
import uploadOnCloudinary from "../../utils/cloudinary.utils.js";
import { sendWelcomeEmail } from "../../config/nodemailer.config.js";
import ApiError from "../../utils/errorHandler.utils.js";
import { hashPassword } from "../../utils/password.utils.js";
import jwt from "jsonwebtoken";

/** Fallback avatar URL used when Cloudinary upload fails */
const DEFAULT_PROFILE_IMAGE =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const registerController = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const hashedPassword = await hashPassword(password);

  // Use uploaded avatar if provided, otherwise fall back to default
  let profileImage = DEFAULT_PROFILE_IMAGE;
  if (req.file?.path) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (cloudinaryResponse) profileImage = cloudinaryResponse.secure_url;
  }

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    profileImage,
  });

  // Respond before sending email so the client isn't blocked
  const token = jwt.sign(
    { id: newUser._id, role: newUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  const cookieDays = parseInt(process.env.COOKIE_EXPIRES_IN, 10) || 1;
  res.cookie("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   cookieDays * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    token,
    _id:          newUser._id,
    name:         newUser.name,
    email:        newUser.email,
    role:         newUser.role,
    profileImage: newUser.profileImage,
  });

  // Fire-and-forget — email failure must never affect the registration response
  sendWelcomeEmail(newUser.email, newUser.name).catch((err) => {
    console.error("Failed to send welcome email:", err.message || err);
  });
};

export default asyncHandler(registerController);
