import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import { deleteFromImageKit } from "../imagekit-service/imagekit.controller";

// 1. Get all size charts (Used by your new Dropdown)
export const getAllSizeCharts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sizeCharts = await prisma.sizeChart.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(sizeCharts);
  } catch (error) {
    return next(error);
  }
};

// 2. Create a new size chart
export const createSizeChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, imageUrl, fileId } = req.body;

    if (!name || !imageUrl || !fileId) {
      return res.status(400).json({ message: "Name, imageUrl, and fileId are required." });
    }

    // Check if name already exists
    const existing = await prisma.sizeChart.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "A size chart with this name already exists." });
    }

    const newSizeChart = await prisma.sizeChart.create({
      data: {
        name,
        imageUrl,
        fileId,
      },
    });

    return res.status(201).json({ message: "Size chart created successfully", sizeChart: newSizeChart });
  } catch (error) {
    return next(error);
  }
};

// 3. Delete a size chart
export const deleteSizeChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const sizeChart = await prisma.sizeChart.findUnique({ where: { id } });
    if (!sizeChart) {
      return res.status(404).json({ message: "Size chart not found" });
    }

    // Delete image from ImageKit first
    if (sizeChart.fileId) {
      await deleteFromImageKit([sizeChart.fileId]); 
    }

    // Delete from Database
    await prisma.sizeChart.delete({ where: { id } });

    return res.json({ message: "Size chart deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

// 4. Update a size chart (and handle ImageKit cleanup)
export const updateSizeChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, fileId } = req.body;

    if (!name || !imageUrl || !fileId) {
      return res.status(400).json({ message: "Name, imageUrl, and fileId are required." });
    }

    // 1. Fetch existing to get old fileId
    const existingChart = await prisma.sizeChart.findUnique({ where: { id } });
    if (!existingChart) {
      return res.status(404).json({ message: "Size chart not found" });
    }

    // 2. Perform DB Update
    const updatedChart = await prisma.sizeChart.update({
      where: { id },
      data: {
        name,
        imageUrl,
        fileId,
      },
    });

    // 3. ImageKit Cleanup Logic 🟢
    // If the fileId has changed, delete the OLD image from ImageKit
    if (existingChart.fileId !== fileId) {
      // Don't await this, let it run in background so response isn't blocked
      deleteFromImageKit([existingChart.fileId]).catch(err => 
        console.error(`Failed to delete old image ${existingChart.fileId} from ImageKit during update:`, err)
      );
    }

    return res.json({ message: "Size chart updated successfully", sizeChart: updatedChart });
  } catch (error) {
    // Handle Prisma unique constraint error if name is taken by another chart
    if ((error as any).code === 'P2002') {
        return res.status(400).json({ message: "A size chart with this name already exists." });
    }
    return next(error);
  }
};