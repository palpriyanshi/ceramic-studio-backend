import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const cleanup = (source) => {
  if (!source.startsWith("http") && fs.existsSync(source)) fs.unlinkSync(source);
};

const uploadOnCloudinary = async (source) => {
  try {
    if (!source) return null;
    const response = await cloudinary.uploader.upload(source, {
      folder: "user_avatars",
      resource_type: "auto",
    });
    cleanup(source);
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    cleanup(source);
    return null;
  }
};

export default uploadOnCloudinary;
