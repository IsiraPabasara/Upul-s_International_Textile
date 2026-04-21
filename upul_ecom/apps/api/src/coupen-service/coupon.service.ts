import { NextFunction, Response } from "express";
import prisma from "../../../../packages/libs/prisma";


export const validateCoupon = async (code: string, userId: string | null, email: string | null, cartTotal: number) => {
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

  // 4. User / Guest Specific Checks
  if (!userId && !coupon.isPublic) {
    // If it's strictly private, still block guests
    throw new Error("Login required to use this coupon");
  }

  if (coupon.limitPerUser) {
    // Use the userId if logged in, otherwise use the guest's email
    const identifier = userId || email;
    
    if (identifier) {
      // Check how many times this specific ID or Email appears in the array
      const usageCount = coupon.usedByUserIds.filter((id: string) => id === userId || id === email).length;
      if (usageCount >= coupon.limitPerUser) {
        throw new Error("You have already reached the usage limit for this coupon");
      }
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
    // Grab the email from the request body
    const { code, cartTotal, userId, email } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: "Coupon code is required" 
      });
    }

    // Pass the email into the validator
    const { coupon, discount } = await validateCoupon(code, userId || null, email || null, cartTotal);

    // Send response using Express 'res' object
    return res.status(200).json({ 
      success: true, 
      discount, 
      finalTotal: Math.max(0, cartTotal - discount),
      code: coupon.code,
      type: coupon.type 
    });

  } catch (error: any) {
    // Handle errors using Express
    console.error("Coupon Error:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Invalid coupon" 
    });
  }
};