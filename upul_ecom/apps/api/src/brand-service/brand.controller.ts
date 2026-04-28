import { Request, Response, NextFunction } from 'express';
import prisma from '../../../../packages/libs/prisma';
import axios from 'axios'; 
import { deleteFromImageKit } from '../imagekit-service/imagekit.controller'; 

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

    const { name, logoUrl, logoFileId } = req.body;
    
    const existing = await prisma.brand.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: "Brand already exists" });
    }

    const brand = await prisma.brand.create({
      data: { 
        name,
        logoUrl: logoUrl || null,
        logoFileId: logoFileId || null 
      }
    });

    return res.status(201).json(brand);
  } catch (error) {
    return next(error);
  }
};

export const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { id } = req.params;

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    const linkedProducts = await prisma.product.count({ 
      where: { brand: brand.name } 
    });
    
    if (linkedProducts > 0) {
      return res.status(400).json({ 
        message: `It is linked to ${linkedProducts} products.` 
      });
    }

    if (brand.logoFileId) {
      await deleteFromImageKit(brand.logoFileId);
    }

    await prisma.brand.delete({ where: { id } });

    return res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { id } = req.params;
    const { name, logoUrl, logoFileId } = req.body;

    const existingBrand = await prisma.brand.findUnique({ where: { id } });

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    if (name && name.toLowerCase() !== existingBrand.name.toLowerCase()) {

      const duplicate = await prisma.brand.findUnique({ where: { name } });
      if (duplicate) {
        return res.status(400).json({ message: "A brand with this name already exists" });
      }
      
      await prisma.product.updateMany({
        where: { brand: existingBrand.name },
        data: { brand: name }
      });
    }

    if (existingBrand.logoFileId && existingBrand.logoFileId !== logoFileId) {

      try {

        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
        const authHeader = Buffer.from(privateKey + ':').toString('base64');
        
        await axios.delete(`https://api.imagekit.io/v1/files/${existingBrand.logoFileId}`, {
          headers: {
            Authorization: `Basic ${authHeader}`
          }
        });
        console.log("Successfully deleted old logo from ImageKit because it was replaced or removed");
      } catch (ikError) {
        console.error("Failed to delete old image from ImageKit:", ikError);
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        logoUrl: logoUrl || null,
        logoFileId: logoFileId || null 
      }
    });

    return res.status(200).json(updatedBrand);
  } catch (error) {
    return next(error);
  }
};