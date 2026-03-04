import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    let finalSKU = data.sku;

    if (!finalSKU) {
      finalSKU = await generateNextSku();
    }

    const existing = await prisma.product.findUnique({
      where: { sku: finalSKU },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Error generating unique SKU, please try again." });
    }

    let calculatedStock = 0;
    if (data.variants && Array.isArray(data.variants)) {
      calculatedStock = data.variants.reduce(
        (sum: number, v: any) => sum + parseInt(v.stock || 0),
        0,
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: finalSKU,
        description: data.description,
        price: parseFloat(data.price),
        availability: data.availability,
        isNewArrival: data.isNewArrival,
        discountType: data.discountType, // "NONE", "PERCENTAGE", or "FIXED"
        discountValue: parseFloat(data.discountValue || 0),
        brand: data.brand,
        images: data.images,
        colors: data.colors || [],
        categoryId: data.categoryId,
        sizeType: data.sizeType, // Save the type (e.g. "Shoes")
        variants: data.variants, // Save the array [{size: "M", stock: 10}, ...]
        stock: calculatedStock, // Save the calculated total
      },
    });
    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return next(error);
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await prisma.product.findMany();
    return res.json(products);
  } catch (error) {
    return next(error);
  }
};

export const getProductBySku = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      return res.status(404).json({ message: "Not found in the DB" });
    }
    return res.json(product);
  } catch (error) {
    return next(error);
  }
};

const generateNextSku = async (prefix = "SKU") => {
  const lastProduct = await prisma.product.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!lastProduct || !lastProduct.sku) {
    return `${prefix}-1`;
  }

  const skuParts = lastProduct.sku.split("-");
  const lastNumber = parseInt(skuParts[skuParts.length - 1]);

  if (isNaN(lastNumber)) {
    return `${prefix}-${Date.now()}`;
  }

  return `${prefix}-${lastNumber + 1}`;
};