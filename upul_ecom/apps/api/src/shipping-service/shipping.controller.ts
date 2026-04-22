import { Request, Response } from 'express';
import prisma from '../../../../packages/libs/prisma'; // Adjust your prisma import

// PUBLIC: Get all active cities for the checkout dropdown
export const getActiveShippingCities = async (req: Request, res: Response) => {
  try {
    const cities = await prisma.shippingCity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, shippingCost: true }
    });
    return res.json({ success: true, cities });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Get all cities
export const getAllShippingCities = async (req: Request, res: Response) => {
  try {
    const cities = await prisma.shippingCity.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, cities });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ADMIN: Create a new city
export const createShippingCity = async (req: Request, res: Response) => {
  try {
    const { name, shippingCost, isActive } = req.body;
    const city = await prisma.shippingCity.create({
      data: { name, shippingCost: Number(shippingCost), isActive }
    });
    return res.json({ success: true, city });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ADMIN: Update a city
export const updateShippingCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, shippingCost, isActive } = req.body;
    const city = await prisma.shippingCity.update({
      where: { id },
      data: { name, shippingCost: Number(shippingCost), isActive }
    });
    return res.json({ success: true, city });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ADMIN: Delete a city
export const deleteShippingCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shippingCity.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
