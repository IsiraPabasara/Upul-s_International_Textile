import { Request, Response, NextFunction } from 'express';
import prisma from '../../../../packages/libs/prisma'; // Adjust path as needed
import { deleteFromImageKit } from '../imagekit-service/imagekit.controller'; // Adjust path as needed

// 1. Get Images (Optional: Filter by Section)
export const getSiteImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { section } = req.query; // e.g., ?section=HERO_BANNER

    const filter = section ? { section: String(section) } : {};

    const siteImages = await prisma.siteImage.findMany({
      where: filter as any,
      orderBy: [
        { section: 'asc' },
        { position: 'asc' } // Keep the category grids in the right order!
      ]
    });

    return res.json(siteImages);
  } catch (error) {
    return next(error);
  }
};

// 2. Create New Image
export const createSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, section, imageUrl, fileId, position, isActive } = req.body;
    
    // Basic validation
    if (!title || !section || !imageUrl || !fileId) {
      return res.status(400).json({ message: "Title, section, imageUrl, and fileId are required" });
    }

    const siteImage = await prisma.siteImage.create({
      data: { 
        title,
        section,
        imageUrl,
        fileId,
        position: position || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return res.status(201).json(siteImage);
  } catch (error) {
    return next(error);
  }
};

// 3. Delete Image
export const deleteSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Find the image first
    const siteImage = await prisma.siteImage.findUnique({ where: { id } });
    if (!siteImage) return res.status(404).json({ message: "Site image not found" });

    // Delete from ImageKit using your helper
    if (siteImage.fileId) {
      try {
        await deleteFromImageKit(siteImage.fileId);
      } catch (ikError) {
        console.error("Failed to delete image from ImageKit:", ikError);
        // Continue to delete from DB even if ImageKit fails
      }
    }

    // Delete from Database
    await prisma.siteImage.delete({ where: { id } });

    return res.status(200).json({ message: "Site image deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

// 4. Update Image
export const updateSiteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, section, imageUrl, fileId, position, isActive } = req.body;

    // Find existing image
    const existingImage = await prisma.siteImage.findUnique({ where: { id } });
    if (!existingImage) {
      return res.status(404).json({ message: "Site image not found" });
    }

    // If the image was replaced, delete the old one from ImageKit
    if (existingImage.fileId && fileId && existingImage.fileId !== fileId) {
      try {
        await deleteFromImageKit(existingImage.fileId);
        console.log("Successfully deleted old site image from ImageKit");
      } catch (ikError) {
        console.error("Failed to delete old image from ImageKit:", ikError);
      }
    }

    // Update in Database
    const updatedImage = await prisma.siteImage.update({
      where: { id },
      data: {
        title: title || existingImage.title,
        section: section || existingImage.section,
        imageUrl: imageUrl || existingImage.imageUrl,
        fileId: fileId || existingImage.fileId,
        position: position !== undefined ? position : existingImage.position,
        isActive: isActive !== undefined ? isActive : existingImage.isActive,
      }
    });

    return res.status(200).json(updatedImage);
  } catch (error) {
    return next(error);
  }
};