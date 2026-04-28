import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import { deleteFromImageKit } from "../imagekit-service/imagekit.controller";

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

export const createSizeChart = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { name, imageUrl, fileId } = req.body;

    if (!name || !imageUrl || !fileId) {
      return res.status(400).json({ message: "Name, imageUrl, and fileId are required." });
    }

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

export const deleteSizeChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const sizeChart = await prisma.sizeChart.findUnique({ where: { id } });
    if (!sizeChart) {
      return res.status(404).json({ message: "Size chart not found" });
    }

    if (sizeChart.fileId) {
      await deleteFromImageKit([sizeChart.fileId]); 
    }

    await prisma.sizeChart.delete({ where: { id } });

    return res.json({ message: "Size chart deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateSizeChart = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { id } = req.params;
    const { name, imageUrl, fileId } = req.body;

    if (!name || !imageUrl || !fileId) {
      return res.status(400).json({ message: "Name, imageUrl, and fileId are required." });
    }

    const existingChart = await prisma.sizeChart.findUnique({ where: { id } });
    if (!existingChart) {
      return res.status(404).json({ message: "Size chart not found" });
    }

    const updatedChart = await prisma.sizeChart.update({
      where: { id },
      data: {
        name,
        imageUrl,
        fileId,
      },
    });

    if (existingChart.fileId !== fileId) {
      deleteFromImageKit([existingChart.fileId]).catch(err => 
        console.error(`Failed to delete old image ${existingChart.fileId} from ImageKit during update:`, err)
      );
    }

    return res.json({ message: "Size chart updated successfully", sizeChart: updatedChart });
  } catch (error) {
    if ((error as any).code === 'P2002') {
        return res.status(400).json({ message: "A size chart with this name already exists." });
    }
    return next(error);
  }
};