import { NextFunction, Response } from "express";
import prisma from "../../../../packages/libs/prisma";


export const validateCoupon = async (code: string, userId: string | null, cartTotal: number) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code },
  });

  if (!coupon) throw new Error("Invalid coupon code");
  if (!coupon.isActive) throw new Error("Coupon is disabled");
  
  // 1. Expiration
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    throw new Error("Coupon has expired");
  }

  // 2. Global Usage Limit
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error("Coupon usage limit reached");
  }

  // 3. Minimum Order Amount
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    throw new Error(`Minimum order of ${coupon.minOrderAmount} required`);
  }

  // 4. User Specific Checks
  if (userId) {
    // Check if user has already used it (if limit exists)
    if (coupon.limitPerUser) {
      const userUsageCount = coupon.usedByUserIds.filter((id: any) => id === userId).length;
      if (userUsageCount >= coupon.limitPerUser) {
        throw new Error("You have already used this coupon");
      }
    }
  } else {
    // If guest tries to use a "logged-in only" code (implied by limitPerUser logic)
    if (!coupon.isPublic || coupon.limitPerUser) {
        throw new Error("Login required to use this coupon");
    }
  }

  // 5. Calculate Discount
  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (cartTotal * (coupon.value / 100));
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }

  // Ensure discount doesn't exceed total
  if (discount > cartTotal) discount = cartTotal;

  return { coupon, discount };
};

export const validateCartCoupon = async (req: any, res: Response, next: NextFunction) => {
  try {
    // 1. In Express, use req.body directly
    const { code, cartTotal, userId } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: "Coupon code is required" 
      });
    }

    // 2. Call your logic helper
    const { coupon, discount } = await validateCoupon(code, userId || null, cartTotal);

    // 3. Send response using Express 'res' object
    return res.status(200).json({ 
      success: true, 
      discount, 
      finalTotal: Math.max(0, cartTotal - discount),
      code: coupon.code,
      type: coupon.type 
    });

  } catch (error: any) {
    // 4. Handle errors using Express
    console.error("Coupon Error:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Invalid coupon" 
    });
  }
};