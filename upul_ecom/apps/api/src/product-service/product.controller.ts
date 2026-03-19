import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import { deleteFromImageKit } from "../imagekit-service/imagekit.controller";

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    
    // 1. Generate SKU if missing
    let finalSKU = data.sku;
    if (!finalSKU) {
      finalSKU = await generateNextSku();
    }

    // 2. Check for Duplicates
    const existing = await prisma.product.findUnique({ where: { sku: finalSKU } });
    if (existing) {
      return res.status(400).json({ message: "Error generating unique SKU, please try again." });
    }

    // 3. CALCULATE STOCK LOGIC
    let finalStock = 0;
    if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
      finalStock = data.variants.reduce(
        (sum: number, v: any) => sum + Number(v.stock || 0), 0
      );
    } else {
      finalStock = Number(data.stock || 0);
    }

    // 4. Create Product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: finalSKU,
        description: data.description,
        price: parseFloat(data.price),
        stock: finalStock,
        availability: finalStock > 0, 
        visible: data.visible !== undefined ? data.visible : true,

        brand: data.brand || null,
        
        // 🟢 Just save the raw string directly
        country: data.country || null,

        images: data.images,
        colors: data.colors || [],
        categoryId: data.categoryId,
        sizeType: data.sizeType,
        variants: data.variants || [], 
        discountType: data.discountType || "NONE",
        discountValue: parseFloat(data.discountValue || 0),
        isNewArrival: data.isNewArrival || false,
      },
    });
    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return next(error);
  }
};

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { sku: { contains: String(search), mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductBySku = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({
      where: { sku },
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          }
        }
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
};

export const updateProductBySku = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku } = req.params;
    const { 
      name, description, price, stock, categoryId, 
      country, // 🟢 Changed from countryId to country
      images, variants, discountType, discountValue, brand, sizeType, visible, colors, isNewArrival
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (!existingProduct) return res.status(404).json({ error: "Product not found" });

    const formattedVariants = Array.isArray(variants)
      ? variants.map((v: any) => ({ size: v.size, stock: Number(v.stock) }))
      : [];

    let finalStock = formattedVariants.length > 0 
      ? formattedVariants.reduce((sum: number, v: any) => sum + v.stock, 0) 
      : Number(stock || 0);

    const updatedProduct = await prisma.product.update({
      where: { sku },
      data: {
        name,
        description,
        price: Number(price), 
        brand: brand || null,
        
        // 🟢 FIXED: Removed 'data.' prefix and used 'country' from destructuring
        country: country || null, 
        
        sizeType,
        stock: finalStock,
        availability: finalStock > 0, 
        visible: visible !== undefined ? visible : existingProduct.visible,
        isNewArrival: isNewArrival !== undefined ? isNewArrival : existingProduct.isNewArrival,
        categoryId: categoryId || existingProduct.categoryId,
        images: images || existingProduct.images, 
        colors: colors || existingProduct.colors,
        variants: formattedVariants, 
        discountType: discountType || "NONE",
        discountValue: Number(discountValue || 0),
      },
    });

    return res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update Error:", error);
    if ((error as any).code === 'P2002') {
        return res.status(400).json({ error: "Duplicate value found." });
    }
    return next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({ 
      where: { sku },
      select: { images: true } 
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const idsToDelete = product.images.map((img: any) => img.fileId).filter(Boolean);
    await deleteFromImageKit(idsToDelete);

    await prisma.product.delete({ where: { sku } });
    return res.json({ success: true, message: "Product and images wiped!" });
  } catch (error) {
    return next(error);
  }
};

export const toggleVisibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku } = req.params;
    const currentProduct = await prisma.product.findUnique({ where: { sku }, select: { visible: true } });
    if (!currentProduct) return res.status(404).json({ error: "Product not found" });

    const product = await prisma.product.update({
      where: { sku },
      data: { visible: !currentProduct.visible },
      select: { sku: true, visible: true },
    });
    return res.json({ success: true, visible: product.visible });
  } catch (error) {
    return next(error);
  }
};

const generateNextSku = async (prefix = "SKU") => {
  const lastProduct = await prisma.product.findFirst({ orderBy: { createdAt: "desc" } });
  if (!lastProduct || !lastProduct.sku) return `${prefix}-1`;
  const skuParts = lastProduct.sku.split("-");
  const lastNumber = parseInt(skuParts[skuParts.length - 1]);
  return isNaN(lastNumber) ? `${prefix}-${Date.now()}` : `${prefix}-${lastNumber + 1}`;
};

export const getProductCountries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🟢 Fetching from your new Country model
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(countries);
  } catch (error) {
    return next(error);
  }
};