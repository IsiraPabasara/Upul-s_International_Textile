import { Request, Response, NextFunction } from 'express';
import prisma from '../../../../packages/libs/prisma';

export const getSizeTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.sizeType.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(types);
  } catch (error) {
    return next(error);
  }
};

export const createSizeType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, values } = req.body; 
    
    if (!name || !values || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ message: "Invalid data. Provide name and array of values." });
    }

    const newType = await prisma.sizeType.create({
      data: { name, values }
    });

    return res.status(201).json(newType);
  } catch (error) {
    return next(error);
  }
};

export const deleteSizeType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.sizeType.delete({ where: { id } });
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    return next(error);
  }
};