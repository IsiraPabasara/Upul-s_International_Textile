import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

/**
 * HELPER: Calculates the correct discounted price for a product
 */
const calculateEffectivePrice = (product: any) => {
  let effectivePrice = product.price;

  if (product.discountType === "PERCENTAGE") {
    effectivePrice = product.price - (product.price * (product.discountValue / 100));
  } else if (product.discountType === "FIXED") {
    effectivePrice = product.price - product.discountValue;
  }

  return Math.max(0, effectivePrice);
};

/**
 * HELPER: Ensures data matches Prisma schema and forces number types
 */
const sanitizeItem = (item: any) => ({
  productId: item.productId,
  sku: item.sku,
  name: item.name || "Product",
  price: Number(item.price), 
  originalPrice: item.originalPrice ? Number(item.originalPrice) : Number(item.price),
  image: item.image || "",
  quantity: Number(item.quantity),
  size: item.size || null, 
  color: item.color || null,
});

// --- 1. Get Cart ---
export const getCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    return res.json(cart ? cart.items : []);
  } catch (error) {
    return next(error);
  }
};

// --- 2. Merge Cart (Login Sync) ---
export const mergeCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { localItems } = req.body;

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId, items: [] } });
    }

    let finalItems: any[] = [...(cart.items as any[])];

    if (localItems && Array.isArray(localItems)) {
      for (const localItem of localItems) {
        const existingIndex = finalItems.findIndex((dbItem) => dbItem.sku === localItem.sku);
        if (existingIndex > -1) {
          finalItems[existingIndex].quantity += localItem.quantity;
        } else {
          finalItems.push(localItem);
        }
      }
    }

    const cleanItems = finalItems.map(sanitizeItem);
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: { items: cleanItems }
    });

    return res.json(updatedCart.items);
  } catch (error) {
    return next(error);
  }
};

// --- 3. Add to Cart ---
export const addToCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const item = req.body; 

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId, items: [] } });
    }

    const items = [...(cart.items as any[])];
    const existingIndex = items.findIndex((i) => i.sku === item.sku);

    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    const cleanItems = items.map(sanitizeItem);
    const updated = await prisma.cart.update({
      where: { userId },
      data: { items: cleanItems }
    });

    return res.json(updated.items);
  } catch (error) {
    return next(error);
  }
};

// --- 4. Update Quantity ---
export const updateCartItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { sku, quantity } = req.body;

    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    
    const items = (cart.items as any[]).map(item => {
      if (item.sku === sku) {
        return sanitizeItem({ ...item, quantity });
      }
      return sanitizeItem(item);
    });

    const updated = await prisma.cart.update({
      where: { userId },
      data: { items }
    });

    return res.json(updated.items);
  } catch (error) {
    return next(error);
  }
};

// --- 5. Remove Item ---
export const removeCartItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { sku } = req.params;

    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    const items = (cart.items as any[])
      .filter(item => item.sku !== sku)
      .map(sanitizeItem);

    const updated = await prisma.cart.update({
      where: { userId },
      data: { items }
    });

    return res.json(updated.items);
  } catch (error) {
    return next(error);
  }
};

// --- 6. Verify Cart (The Security Check) ---
export const verifyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body; 
    const errors: Record<string, string> = {};
    const updatedPrices: Record<string, number> = {}; 
    let isValid = true;

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId) as any;
      const errorKey = item.sku;

      // Check Existence & Visibility
      if (!product || !product.visible) {
        errors[errorKey] = "Item no longer available";
        isValid = false;
        continue;
      }

      // Calculate the Discounted Price dynamically
      const dbPrice = calculateEffectivePrice(product);
      
      // Price Validation (Compare with Frontend Price)
      if (Number(item.price).toFixed(2) !== dbPrice.toFixed(2)) {
        isValid = false;
        updatedPrices[errorKey] = dbPrice;
        errors[errorKey] = `Price updated to LKR ${dbPrice.toLocaleString()}`;
      }

      // Stock Validation
      if (item.size) {
        const variant = (product.variants as any[]).find((v: any) => v.size === item.size);
        if (!variant || variant.stock < item.quantity) {
          errors[errorKey] = variant ? `Only ${variant.stock} left` : "Size unavailable";
          isValid = false;
        }
      } else {
        if (product.stock < item.quantity) {
          errors[errorKey] = `Only ${product.stock} left`;
          isValid = false;
        }
      }
    }

    return res.json({ isValid, errors, updatedPrices });
  } catch (error) {
    return next(error);
  }
};