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

    // 1. Find the brand first
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // 2. Prevent deletion if products are currently using this brand
    const linkedProducts = await prisma.product.count({ 
      where: { brand: brand.name } 
    });
    
    if (linkedProducts > 0) {
      return res.status(400).json({ 
        message: `Cannot delete brand. It is linked to ${linkedProducts} products.` 
      });
    }

    // 🟢 3. The New Way: Use the helper we built!
    // This replaces all the Axios/Buffer/Private Key code.
    if (brand.logoFileId) {
      await deleteFromImageKit(brand.logoFileId);
    }

    // 4. Finally, delete from your Database
    await prisma.brand.delete({ where: { id } });

    return res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

// Update Brand Function
export const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, logoUrl, logoFileId } = req.body;

    // 1. Find the existing brand first
    const existingBrand = await prisma.brand.findUnique({ where: { id } });
    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // 2. Check for name duplication & Update connected products!
    if (name && name.toLowerCase() !== existingBrand.name.toLowerCase()) {
      const duplicate = await prisma.brand.findUnique({ where: { name } });
      if (duplicate) {
        return res.status(400).json({ message: "A brand with this name already exists" });
      }
      
      // 🟢 PRO FIX: If the brand name changes, update all existing products so their logos don't break!
      await prisma.product.updateMany({
        where: { brand: existingBrand.name },
        data: { brand: name }
      });
    }

    // 3. Delete the old logo if the logoFileId has changed OR been removed!
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
        // We continue anyway so the database still updates properly
      }
    }

    // 4. Update the brand in MongoDB
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        // If logoUrl is empty, save as null
        logoUrl: logoUrl || null,
        // If logoFileId is empty, save as null
        logoFileId: logoFileId || null 
      }
    });

    return res.status(200).json(updatedBrand);
  } catch (error) {
    return next(error);
  }
};