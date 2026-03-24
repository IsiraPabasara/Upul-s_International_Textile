import { Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

// --- 🛠️ Helper: Strip extra UI fields (brand, availability, etc.) ---
// Prisma throws 500 if we try to save fields not defined in 'type WishlistItem'
const sanitizeItem = (item: any) => {
  return {
    productId: item.productId,
    name: item.name,
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price, // Ensure number
    image: item.image || '',
    slug: item.slug || ''
  };
};

// --- 1. Merge Local Wishlist to DB (On Login) ---
export const mergeWishlist = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { localItems } = req.body; 

    // 1. Sanitize incoming array
    const cleanLocalItems = Array.isArray(localItems) 
      ? localItems.map(sanitizeItem) 
      : [];

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId, items: [] }
      });
    }

    // 2. Merge Logic: prevent duplicates
    const dbItemIds = new Set(wishlist.items.map((i: any) => i.productId));
    const newItems = [...wishlist.items];

    for (const item of cleanLocalItems) {
      if (!dbItemIds.has(item.productId)) {
        newItems.push(item);
        dbItemIds.add(item.productId);
      }
    }

    const updated = await prisma.wishlist.update({
      where: { userId },
      data: { items: newItems }
    });

    return res.json(updated.items);
  } catch (error) {
    console.error("Merge Wishlist Error:", error);
    return next(error);
  }
};

// --- 2. Toggle Item (Add/Remove) ---
export const toggleWishlistItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    // 1. Sanitize the single item
    const item = sanitizeItem(req.body); 

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId, items: [] } });
    }

    const exists = wishlist.items.find((i: any) => i.productId === item.productId);
    let newItems;

    if (exists) {
      // Remove it
      newItems = wishlist.items.filter((i: any) => i.productId !== item.productId);
    } else {
      // Add it
      newItems = [...wishlist.items, item];
    }

    const updated = await prisma.wishlist.update({
      where: { userId },
      data: { items: newItems }
    });

    return res.json(updated.items);
  } catch (error) {
    console.error("Toggle Wishlist Error:", error);
    return next(error);
  }
};

// --- 3. Get Wishlist ---
export const getWishlist = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    return res.json(wishlist ? wishlist.items : []);
  } catch (error) {
    return next(error);
  }
};