import { Request, Response } from "express";
import prisma from "../../../../packages/libs/prisma";
import redis from "../../../../packages/libs/redis";
import md5 from "md5";
import {
  sendOrderConfirmation,
  sendShopNewOrderNotification,
} from "../email-service/email.service";

export const handlePayHereNotify = async (req: Request, res: Response) => {
  const { merchant_id, order_id, payment_id, status_code, md5sig, payhere_amount, payhere_currency } = req.body;

  console.log('📨 PayHere Webhook Received:', { merchant_id, order_id, payment_id, status_code });

  let initialLog: any;

  try {
    // 1. IMMEDIATE LOGGING (Step 0)
    // Record that a notification was received before any processing
    initialLog = await prisma.paymentLog.create({
      data: {
        orderId: order_id,
        paymentId: payment_id,
        statusCode: status_code,
        rawPayload: req.body,
        status: 'RECEIVED'
      }
    });
    console.log('✅ Payment log created:', initialLog.id);
  } catch (logError) {
    console.error('❌ Failed to create initial payment log:', logError);
    // Continue processing even if logging fails
  }

  // 2. ATTEMPT TO ACQUIRE IDEMPOTENCY LOCK
  const lockKey = `lock:payment_notify:${order_id}`;
  // Using options object to avoid "No overload matches" error
  const lockAcquired = await redis.set(lockKey, "locked", "EX", 15, "NX");

  if (!lockAcquired) {
    return res.status(200).send("Processing in progress");
  }

  try {
    // 3. Signature Verify
    const secret = process.env.PAYHERE_SECRET!;
    const hashedSecret = md5(secret).toUpperCase();
    const localHash = md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret).toUpperCase();

    if (localHash !== md5sig) {
      if (initialLog?.id) {
        await prisma.paymentLog.update({
          where: { id: initialLog.id },
          data: { status: 'FAILED_SIGNATURE' }
        }).catch(err => console.error('Failed to update log for signature:', err));
      }
      return res.status(400).send("Invalid Signature");
    }

    // 4. CURRENCY VALIDATION
    if (payhere_currency !== "LKR") {
      if (initialLog?.id) {
        await prisma.paymentLog.update({
          where: { id: initialLog.id },
          data: { status: 'INVALID_CURRENCY' }
        }).catch(err => console.error('Failed to update log for currency:', err));
      }
      return res.status(400).send("Invalid Currency");
    }

    // 5. RETRIEVE SHADOW ORDER FROM REDIS
    const shadowOrderRaw = await redis.get(`pending_order:${order_id}`);
    
    if (!shadowOrderRaw) {
        const exists = await prisma.order.findUnique({ where: { orderNumber: order_id }});
        if(exists) {
          if (initialLog?.id) {
            await prisma.paymentLog.update({
              where: { id: initialLog.id },
              data: { status: 'DUPLICATE_IGNORE' }
            }).catch(err => console.error('Failed to update log for duplicate:', err));
          }
          return res.status(200).send("Order already exists");
        }
        return res.status(404).send("Session expired or invalid");
    }

    const shadowOrder = JSON.parse(shadowOrderRaw);

    const payHereAmountNum = parseFloat(payhere_amount);
    // Ensure what they paid matches what we expected in Redis
    if (Math.abs(payHereAmountNum - shadowOrder.grandTotal) > 0.01) {
        if (initialLog?.id) {
          await prisma.paymentLog.update({
              where: { id: initialLog.id },
              data: { status: 'AMOUNT_MISMATCH' }
          }).catch(err => console.error('Failed to update log for amount mismatch:', err));
        }
        return res.status(400).send("Amount mismatch");
    }

    // ✅ SCENARIO 1: SUCCESS (Status = 2)
    if (status_code === "2") {
        
        await prisma.$transaction(async (tx: any) => {
            // A. Deduct Stock (With Safety Check)
            for (const item of shadowOrder.finalItems) {
                const product = await tx.product.findUnique({ where: { id: item.productId }});
                
                let currentStockAvailable = product.stock;
                if (item.size) {
                  const variant = product.variants.find((v: any) => v.size === item.size);
                  currentStockAvailable = variant ? variant.stock : 0;
                }

                if (currentStockAvailable < item.quantity) {
                  throw new Error(`Insufficient stock for ${product.name}. Transaction aborted.`);
                }
                
                if (item.size) {
                     const currentVariants = product?.variants as any[];
                     const newVariants = currentVariants.map((v:any) => v.size === item.size ? {...v, stock: v.stock - item.quantity} : v);
                     await tx.product.update({ where: {id: item.productId}, data: { variants: newVariants }});
                } else {
                     await tx.product.update({ where: {id: item.productId}, data: { stock: { decrement: item.quantity }}});
                }
            }

            // B. Update Coupon (if used)
            if (shadowOrder.appliedCouponCode) {
                await tx.coupon.update({
                     where: { code: shadowOrder.appliedCouponCode },
                     // Push email if customerId doesn't exist
                     data: { usedCount: { increment: 1 }, usedByUserIds: { push: shadowOrder.customerId || shadowOrder.customerEmail } }
                });
            }

            // C. CREATE THE ORDER
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: shadowOrder.orderNumber,
                    guestToken: shadowOrder.guestToken,
                    userId: shadowOrder.customerId,
                    email: shadowOrder.customerEmail,
                    shippingAddress: shadowOrder.shippingAddress,
                    billingAddress: shadowOrder.billingAddress,
                    items: shadowOrder.finalItems,
                    totalAmount: shadowOrder.grandTotal,
                    discountAmount: shadowOrder.finalDiscount,
                    couponCode: shadowOrder.appliedCouponCode,
                    status: 'CONFIRMED',
                    paymentMethod: 'PAYHERE',
                    trackingNumber: payment_id
                }
            });

            // D. Clear Cart
            if (shadowOrder.customerId) {
                await tx.cart.update({ where: { userId: shadowOrder.customerId }, data: { items: [] } });
            }

            return newOrder;
        });

        // Cleanup Redis
        await redis.del(`pending_order:${order_id}`);

        // Update Log to Success
        if (initialLog?.id) {
          await prisma.paymentLog.update({
            where: { id: initialLog.id },
            data: { status: 'SUCCESS' }
          }).catch(err => console.error('Failed to update log for success:', err));
        }

        // Emails
        const emailOrderObj = { 
            ...shadowOrder, 
            email: shadowOrder.customerEmail,
            items: shadowOrder.finalItems,
            totalAmount: shadowOrder.grandTotal,
            status: 'CONFIRMED', 
            paymentMethod: 'PAYHERE' 
        };
        sendOrderConfirmation(emailOrderObj).catch(console.error);
        sendShopNewOrderNotification(emailOrderObj).catch(console.error);
        
        return res.status(200).send("Order Created");
    }

    // ❌ SCENARIO 2: FAILED
    if (initialLog?.id) {
      await prisma.paymentLog.update({
        where: { id: initialLog.id },
        data: { status: 'PAYMENT_FAILED_NOTIFY' }
      }).catch(err => console.error('Failed to update log for payment failed:', err));
    }
    return res.status(200).send("Payment Failed - No Order Created");

  } catch (error: any) {
     console.error("Webhook Error", error);
     if (initialLog?.id) {
       await prisma.paymentLog.update({
         where: { id: initialLog.id },
         data: { status: 'ERROR', rawPayload: { ...req.body, error: error.message } }
       }).catch(err => console.error('Failed to update log for error:', err));
     }
     return res.status(500).send("Error");
  } finally {
    await redis.del(lockKey);
  }
};