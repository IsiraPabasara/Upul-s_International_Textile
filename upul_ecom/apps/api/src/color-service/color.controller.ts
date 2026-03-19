import { Request, Response, NextFunction } from 'express';
import prisma from '../../../../packages/libs/prisma';

export const getColors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colors = await prisma.color.findMany({ orderBy: { createdAt: 'asc' } });
    return res.json(colors);
  } catch (error) { return next(error); }
};

export const createColor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, hexCode } = req.body;
    const color = await prisma.color.create({ data: { name, hexCode } });
    return res.status(201).json(color);
  } catch (error) { return next(error); }
};