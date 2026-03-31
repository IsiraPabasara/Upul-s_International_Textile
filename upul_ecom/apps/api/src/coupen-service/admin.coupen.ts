import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

// --- GET ALL COUPONS ---
export const getAllCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(coupons);
  } catch (error) {
    return next(error);
  }
};

// --- CREATE COUPON ---
export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      code, 
      type, 
      value, 
      minOrderAmount, 
      expiresAt, 
      limitPerUser, 
      maxUses, 
      isPublic 
    } = req.body;

    // specific validation
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) return res.status(400).json({ message: "Coupon code already exists" });

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(), // Store uppercase
        type, // 'PERCENTAGE' or 'FIXED'
        value: parseFloat(value),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        limitPerUser: limitPerUser ? parseInt(limitPerUser) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        isPublic: isPublic, 
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      }
    });

    return res.status(201).json(newCoupon);
  } catch (error) {
    return next(error);
  }
};

// --- DELETE COUPON ---
export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    return res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    return next(error);
  }
};

// --- TOGGLE STATUS ---
export const toggleCouponStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive }
    });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};