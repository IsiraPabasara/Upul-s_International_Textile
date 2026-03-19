import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

// 1. GET INVENTORY LIST (Optimized with Variant-Aware Filters) ⚡
export const getInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      stock_status,
      filter_type,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      AND: [] 
    };

    // 🔍 Search Logic
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { sku: { contains: String(search), mode: "insensitive" } },
        ]
      });
    }

    // 📉 Filter Logic: Out of Stock
    // Fix: Check if Parent is 0 OR if ANY variant is 0
    if (stock_status === "out_of_stock") {
      where.AND.push({
        OR: [
          { stock: 0 }, 
          { variants: { some: { stock: 0 } } }
        ]
      });
    }

    // ⚡ Filter Logic: Low Stock
    // Fix: Check if Parent is < 10 OR if ANY variant is < 10
    if (filter_type === "low_stock") {
      where.AND.push({
        OR: [
          { 
            stock: { gte: 0, lt: 10 }, 
            variants: { none: {} } 
          },
          { 
             variants: { 
               some: { stock: { gte: 0, lt: 10 } } 
             } 
          }
        ]
      });
    }

    // 🔥 RUN PARALLEL QUERIES
    const [total, rawProducts, globalStats, allProductsValue] =
      await prisma.$transaction([
        // 1. Count
        prisma.product.count({ where }),

        // 2. List Data
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            variants: true,
            images: true,
            updatedAt: true,
            price: true,
          },
        }),

        // 3. Global Stats
        prisma.product.aggregate({
          _sum: { stock: true },
          _count: { id: true },
        }),

        // 4. Fetch ALL data for accurate "Out of Stock" calculation
        // We fetch everything to calculate the precise row-level stats
        prisma.product.findMany({
          select: { stock: true, price: true, variants: true },
        }),
      ]);

    // 🧮 CALCULATE REAL STATS (Drill into Variants!)
    const outOfStockCount = allProductsValue.reduce((count: number, p: any) => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        // Count specific variants that are 0
        const emptyVariants = (p.variants as any[]).filter(
          (v: any) => v.stock === 0,
        ).length;
        return count + emptyVariants;
      } else {
        return count + (p.stock === 0 ? 1 : 0);
      }
    }, 0);

    const totalInventoryValue = allProductsValue.reduce((acc: number, curr: any) => {
      const price = Number(curr.price) || 0;
      const stock = Number(curr.stock) || 0;
      return acc + price * stock;
    }, 0);

    // Optimize Images
    const products = rawProducts.map((p: any) => ({
      ...p,
      images:
        Array.isArray(p.images) && p.images.length > 0 ? [p.images[0]] : [],
    }));

    return res.json({
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: {
        totalStock: globalStats._sum.stock || 0,
        outOfStock: outOfStockCount,
        totalValue: totalInventoryValue,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ... (bulkUpdateInventory remains the same)
// inventoryController.ts

export const bulkUpdateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates array" });
    }

    // 1️⃣ CRITICAL FIX: Group updates by SKU first!
    // This prevents overwriting data if multiple variants of the same product are updated.
    const updatesBySku: Record<string, any[]> = {};
    updates.forEach((update) => {
      if (!updatesBySku[update.sku]) {
        updatesBySku[update.sku] = [];
      }
      updatesBySku[update.sku].push(update);
    });

    const results = await prisma.$transaction(async (tx: any) => {
      const skuKeys = Object.keys(updatesBySku);

      return Promise.all(
        skuKeys.map(async (sku) => {
          const productUpdates = updatesBySku[sku]; // All updates for this SKU
          
          // Fetch product once
          const product = await tx.product.findUnique({ where: { sku } });
          if (!product) throw new Error(`Product ${sku} not found`);

          let currentVariants = Array.isArray(product.variants) ? [...product.variants] : [];
          let currentStock = Number(product.stock);
          let updatedData: any = {};

          // Apply ALL updates for this SKU in memory first
          for (const update of productUpdates) {
             const stockVal = Number(update.newStock);

             if (update.variantSize && currentVariants.length > 0) {
                const vIndex = currentVariants.findIndex((v: any) => v.size === update.variantSize);
                if (vIndex > -1) {
                   // Update specific variant stock
                   currentVariants[vIndex] = { ...currentVariants[vIndex], stock: stockVal };
                }
             } else {
                // Update main stock (simple product)
                currentStock = stockVal;
             }
          }

          // Calculate final totals
          if (currentVariants.length > 0) {
             const totalStock = currentVariants.reduce((sum, v: any) => sum + Number(v.stock), 0);
             updatedData = {
               variants: currentVariants,
               stock: totalStock,
               availability: totalStock > 0
             };
          } else {
             updatedData = {
               stock: currentStock,
               availability: currentStock > 0
             };
          }

          // Write to DB once per SKU
          return tx.product.update({
            where: { sku },
            data: updatedData,
          });
        })
      );
    });

    return res.json({ success: true, count: results.length });
  } catch (error) {
    return next(error);
  }
};
