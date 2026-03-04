import { Request, Response, NextFunction } from 'express';
import prisma from '../../../../packages/libs/prisma';

export const getBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(brands);
  } catch (error) {
    return next(error);
  }
};

export const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const existing = await prisma.brand.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Brand already exists" });
    }

    const brand = await prisma.brand.create({
      data: { name }
    });

    return res.status(201).json(brand);
  } catch (error) {
    return next(error);
  }
};