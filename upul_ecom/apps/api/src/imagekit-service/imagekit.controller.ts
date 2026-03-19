import { Request, Response, NextFunction } from "express";
import ImageKit from "imagekit";

// 1. Initialize the SDK
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

/**
 * 🟢 INTERNAL SERVICE HELPER
 * Use this inside other controllers (Product, Brand, etc.)
 * Supports a single fileId string OR an array of fileId strings.
 */
export const deleteFromImageKit = async (fileIds: string | string[]) => {
  try {
    if (Array.isArray(fileIds)) {
      // Filter out any null/undefined IDs to prevent SDK errors
      const validIds = fileIds.filter(Boolean);
      if (validIds.length === 0) return;

      // Delete all in parallel for maximum speed
      const deletePromises = validIds.map((id) => imagekit.deleteFile(id));
      await Promise.all(deletePromises);
    } else if (fileIds) {
      // Delete a single file
      await imagekit.deleteFile(fileIds);
    }
    console.log("🧹 ImageKit cleanup successful");
  } catch (error: any) {
    // We log but don't throw. If an image is missing, 
    // we still want the Product/Brand to be deleted from the DB.
    console.error("ImageKit deletion warning:", error.message || error);
  }
};

/**
 * 🟢 GET AUTH PARAMS
 * Provides the signature for your frontend upload service
 */
export const getAuthParams = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return res.json(authenticationParameters);
  } catch (error) {
    return next(error);
  }
};

/**
 * 🟢 DELETE FILE ENDPOINT
 * Handles direct DELETE requests from the frontend
 */
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required" });
    }

    // Call our internal helper
    await deleteFromImageKit(fileId);

    return res.json({ message: "File deleted successfully from ImageKit" });
  } catch (error) {
    return next(error);
  }
};