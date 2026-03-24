import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import { sendOrderRefunded } from "../email-service/email.service"; // Ensure you create this

export const refundOrder = async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // 1. Safety Checks
    if (order.status === 'REFUNDED') {
        return res.status(400).json({ message: "Order is already refunded" });
    }
    if (order.paymentMethod !== 'PAYHERE') {
        return res.status(400).json({ message: "Only PayHere orders can be marked as refunded here." });
    }

    // 2. TRANSACTION: Update Status + Restore Stock
    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      // A. Update Status
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      });

      // B. RESTORE STOCK (Reuse your existing logic)
      const items = order.items as any[];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId }});
        if (!product) continue;

        if (item.size) {
          // Restore Variant Stock
          const currentVariants = (product.variants as any[]) || [];
          const newVariants = currentVariants.map((v: any) => {
            if (v.size === item.size) return { ...v, stock: (v.stock || 0) + item.quantity };
            return v;
          });
          await tx.product.update({ where: { id: item.productId }, data: { variants: newVariants } });
        } else {
          // Restore Standard Stock
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }

      return result;
    });

    // 3. Send Email
    sendOrderRefunded(updatedOrder).catch(console.error);

    return res.status(200).json({ success: true, message: "Refund recorded & Stock restored", order: updatedOrder });

  } catch (error) {
    return next(error);
  }
};