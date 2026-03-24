import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma"; // Adjust path if needed
import { v4 as uuidv4 } from 'uuid'; 
import { sendOrderCancelled, sendOrderConfirmation, sendShopNewOrderNotification } from "../email-service/email.service";
import { validateCoupon } from "../coupen-service/coupon.service";
import md5 from 'md5';
import redis from "../../../../packages/libs/redis";

// Helper: Generate a short, readable 6-digit ID (e.g., "829304")
const generateOrderNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Inside createOrder function:
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  // 🟢 1. Destructure billingAddress from req.body
  const { type, userId, addressId, address, billingAddress, items, email, paymentMethod, couponCode } = req.body;

  try {
    // --- 1. PREPARE COMMON DATA ---
    let shippingAddress;
    let customerEmail;
    let customerId: string | null = null;
    const guestToken = uuidv4();

    // Resolve User/Address
    if (type === 'USER') {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });
      const selectedAddr = user.addresses.find((a: any) => a.id === addressId);
      if (!selectedAddr) return res.status(400).json({ message: "Invalid Address ID" });
      shippingAddress = selectedAddr;
      customerEmail = user.email;
      customerId = user.id;
    } else {
      shippingAddress = address;
      customerEmail = email;
    }

    // 🟢 2. Determine final billing address (fallback to shipping if null)
    const finalBillingAddress = billingAddress || shippingAddress;

    // --- 2. CALCULATE TOTALS (No Stock Deduction Yet) ---
    // We only READ the database here to get prices and check availability.
    let calculatedTotal = 0;
    const finalItems: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new Error(`Product not found: ${item.sku}`);

      // Basic Stock Check (Peek only)
      let currentStock = product.stock;
      if (item.size) {
        const variant = product.variants.find((v: any) => v.size === item.size);
        if (variant) currentStock = variant.stock;
      }
      if (currentStock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      // Price Calc
      let price = product.price;
      if (product.discountType === 'PERCENTAGE') price -= price * (product.discountValue / 100);
      else if (product.discountType === 'FIXED') price -= product.discountValue;

      calculatedTotal += price * item.quantity;
      finalItems.push({
        productId: product.id,
        sku: item.sku,
        name: product.name,
        image: product.images[0]?.url || '',
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      });
    }

    // Coupon Logic
    let finalDiscount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const { coupon, discount } = await validateCoupon(couponCode, customerId, calculatedTotal);
      finalDiscount = discount;
      appliedCouponCode = coupon.code;
    }
    const grandTotal = Math.max(0, calculatedTotal - finalDiscount);
    const orderNumber = generateOrderNumber();

    // ==========================================
    // 🟢 PATH A: PAYHERE (REDIS CACHE STRATEGY)
    // ==========================================
    if (paymentMethod === 'PAYHERE') {
      const merchantId = process.env.PAYHERE_MERCHANT_ID;
      const secret = process.env.PAYHERE_SECRET;

      if (!merchantId || !secret) throw new Error("PayHere config missing");

      // 1. Prepare Payload for Redis
      const shadowOrder = {
        orderNumber,
        guestToken,
        customerId,
        customerEmail,
        shippingAddress,
        billingAddress: finalBillingAddress, // 🟢 3. Add to Redis payload
        finalItems,
        grandTotal,
        finalDiscount,
        appliedCouponCode,
        type // USER or GUEST
      };

      // 2. Save to Redis (Expire in 30 mins)
      // Key: "pending_order:123456"
      await redis.set(`pending_order:${orderNumber}`, JSON.stringify(shadowOrder), 'EX', 1800);

      // 3. Generate Hash
      const currency = 'LKR';
      const amountStr = grandTotal.toFixed(2);
      const hashedSecret = md5(secret).toUpperCase();
      const hash = md5(merchantId + orderNumber + amountStr + currency + hashedSecret).toUpperCase();

      // 4. Return Params (NO ORDER CREATED IN DB)
      return res.status(200).json({
        success: true,
        isPayHere: true,
        orderId: orderNumber, // needed for frontend tracking
        payhereParams: {
          sandbox: true,
          merchant_id: merchantId,
          return_url: `${process.env.FRONTEND_URL}/checkout/success?orderNumber=${orderNumber}`, // PayHere redirects here on success
          cancel_url: `${process.env.FRONTEND_URL}/checkout`, // Simply go back to checkout
          notify_url: `${process.env.API_URL}/api/payment/notify`,
          order_id: orderNumber,
          items: "Order #" + orderNumber,
          currency: currency,
          amount: amountStr,
          first_name: shippingAddress.firstname,
          last_name: shippingAddress.lastname,
          email: customerEmail,
          phone: shippingAddress.phoneNumber,
          address: shippingAddress.addressLine,
          city: shippingAddress.city,
          country: "Sri Lanka",
          hash: hash
        }
      });
    }

    // ==========================================
    // 🔵 PATH B: COD (IMMEDIATE DB CREATION)
    // ==========================================
    // (This block remains exactly the same as your previous code because COD is instant)
    const order = await prisma.$transaction(async (tx: any) => {
        // ... (Repeat the stock deduction & Order.create logic you had for COD)
        // Since you wanted to reuse code, ideally you extract the deduction logic to a helper function.
        // For brevity, I assume you keep the existing COD transaction logic here.
        
        // 1. Deduct Stock
        for (const item of items) {
             // ... DB Update Logic ...
             const product = await tx.product.findUnique({ where: { id: item.productId }});
             if(item.size) {
                 // update variant stock
                  const newVariants = product?.variants.map((v:any) => v.size === item.size ? {...v, stock: v.stock - item.quantity} : v);
                  await tx.product.update({ where: {id: product?.id}, data: { variants: newVariants }});
             } else {
                 await tx.product.update({ where: {id: product?.id}, data: { stock: { decrement: item.quantity }}});
             }
        }

        // 2. Update Coupon
        if (appliedCouponCode) {
          await tx.coupon.update({
            where: { code: appliedCouponCode },
            data: { usedCount: { increment: 1 }, usedByUserIds: { push: customerId || '' } }
          });
        }

        // 3. Create Order
        const orderData: any = {
          orderNumber,
          guestToken,
          email: customerEmail,
          shippingAddress,
          billingAddress: finalBillingAddress,
          items: finalItems,
          totalAmount: grandTotal,
          discountAmount: finalDiscount,
          couponCode: appliedCouponCode,
          status: 'PENDING',
          paymentMethod: 'COD'
        };

        // Only add userId if customerId exists
        if (customerId) {
          orderData.userId = customerId;
        }

        const newOrder = await tx.order.create({ data: orderData });

        // 4. Clear Cart
        if (customerId) {
          await tx.cart.update({ where: { userId: customerId }, data: { items: [] } });
        }
        return newOrder;
    });

    sendOrderConfirmation(order).catch(console.error);
    sendShopNewOrderNotification(order).catch(console.error);

    return res.status(200).json({
      success: true,
      orderId: order.orderNumber,
      guestToken: order.guestToken
    });

  } catch (error: any) {
    console.error("Order Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getGuestOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    if (!token) return res.status(400).json({ message: "Token required" });

    const order = await prisma.order.findUnique({
      where: { guestToken: token }
    });

    if (!order) {
      return res.status(404).json({ message: "Invalid tracking link" });
    }

    // If the order is finished, we block access to protect customer privacy
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(410).json({
        message: "Link Expired",
        reason: order.status, // "DELIVERED" or "CANCELLED"
        orderNumber: order.orderNumber // Let them know which order it was
      });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

export const getUserOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    // 1. Get page and limit from query strings
    // Default to Page 1 and 8 items per page
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;
    const skip = (page - 1) * limit;

    // 2. Run both queries in parallel for better performance
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: skip, // Offset
        take: limit, // Limit
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          totalAmount: true,
          items: true 
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);

    // 3. Return structured data for the frontend
    return res.json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    });

  } catch (error) {
    return next(error);
  }
};

// --- 6. GET SINGLE ORDER (Logged In) ---
export const getOrderById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Security Check: Ensure this order belongs to the user
    if (order.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to this order" });
    }

    return res.json(order);
  } catch (error) {
    return next(error);
  }
};


// --- 7. CANCEL ORDER (Shared Logic for Stock Restoration) ---
const cancelOrderLogic = async (orderId: string, tx: any) => {
  // 1. Fetch current order to get items
  const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
  
  if (!currentOrder) throw new Error("Order not found");
  if (currentOrder.status !== "PENDING") {
    throw new Error("Order cannot be cancelled. It has already been confirmed or processed.");
  }

  // 2. Update Status to CANCELLED
  const updatedOrder = await tx.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  // 3. RESTORE STOCK
  const items = currentOrder.items as any[];

  for (const item of items) {
    if (item.size) {
      // Handle Variants
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        const newVariants = (product.variants as any[]).map((v: any) => {
          if (v.size === item.size) {
            return { ...v, stock: v.stock + item.quantity };
          }
          return v;
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { variants: newVariants },
        });
      }
    } else {
      // Handle Standard Stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  return updatedOrder;
};

// --- API: Cancel for Logged In User ---
export const cancelUserOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== userId) return res.status(403).json({ message: "Unauthorized" });

    const result = await prisma.$transaction(async (tx: any) => {
       return await cancelOrderLogic(id, tx);
    });

    // Send Email asynchronously
    sendOrderCancelled(result).catch(console.error);

    return res.json({ success: true, message: "Order cancelled successfully", order: result });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// --- API: Cancel for Guest (via Token) ---
export const cancelGuestOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const order = await prisma.order.findUnique({ where: { guestToken: token } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const result = await prisma.$transaction(async (tx: any) => {
      return await cancelOrderLogic(order.id, tx);
    });

    // Send Email asynchronously
    sendOrderCancelled(result).catch(console.error);

    return res.json({ success: true, message: "Order cancelled successfully", order: result });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};