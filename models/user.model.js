/**
 * @file user.model.js
 * @description Mongoose schema and model for application users.
 *
 * Fields:
 *  - name         {string}  required — display name
 *  - email        {string}  required — login identifier (should be unique; add index if needed)
 *  - password     {string}  required — bcrypt hash (never returned in responses)
 *  - role         {string}  "user" | "admin" — controls access to admin endpoints
 *  - profileImage {string}  URL to avatar (defaults to a placeholder)
 *  - timestamps           — createdAt, updatedAt added automatically
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
    },
    email: {
      type:     String,
      required: true,
    },
    password: {
      type:     String,
      required: true,
    },
    /** "user" has access to own profile and orders; "admin" has full CRUD access */
    role: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
    },
    profileImage: {
      type:    String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
