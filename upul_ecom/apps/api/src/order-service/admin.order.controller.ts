import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import { sendOrderCancelled, sendOrderDelivered, sendOrderProcessing, sendOrderReturned, sendShippingUpdate } from "../email-service/email.service";

// 📊 GET TOTAL ORDER STATS (For the top cards)
export const getAdminOrderStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const stats = {
      ALL: 0,
      PENDING: 0,
      PROCESSING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0, // 🟢 Now separate
      RETURNED: 0,  // 🟢 Now separate
    };

    statusCounts.forEach((item: any) => {
      const count = item._count._all;
      stats.ALL += count;
      if (item.status in stats) {
        stats[item.status as keyof typeof stats] += count;
      }
    });

    return res.json(stats);
  } catch (error) {
    return next(error);
  }
};
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract query params (with safe defaults)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string || "ALL";
    const search = req.query.search as string || "";

    const skip = (page - 1) * limit;

    // 2. Build the Prisma WHERE clause dynamically
    const whereClause: any = {};

    // Apply Status Filter
    if (filter !== "ALL") {
      if (filter === "ISSUES") {
        whereClause.status = { in: ["CANCELLED", "RETURNED"] };
      } else {
        whereClause.status = filter;
      }
    }

    // Apply Search Query (Search by Order ID or Email)
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    // 3. Fire both queries at the exact same time for maximum speed
    const [totalOrders, orders] = await prisma.$transaction([
      prisma.order.count({ where: whereClause }), // Gets total matches for pagination math
      prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit, // ONLY grab the 10 we need!
      }),
    ]);

    // 4. Return a structured pagination object
    return res.json({
      orders,
      metadata: {
        total: totalOrders,
        page,
        totalPages: Math.ceil(totalOrders / limit),
        hasMore: page * limit < totalOrders
      }
    });

  } catch (error) {
    return next(error);
  }
};

// 2. GET SINGLE ORDER DETAILS
export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { firstname: true, lastname: true, email: true } } }
    });
    
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json(order);
  } catch (error) {
    return next(error);
  }
};

// 3. UPDATE STATUS (The Workflow Engine)
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 1. Get Current Order to check items
    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!currentOrder) return res.status(404).json({ message: "Order not found" });

    // 2. Prepare Update Data
    const updateData: any = { status };
    if (status === "SHIPPED") {
      if (!trackingNumber)
        return res.status(400).json({ message: "Tracking number required" });
      updateData.trackingNumber = trackingNumber;
    }

    // 3. TRANSACTION: Update Status + Restore Stock (if Cancelled/Returned)
    const result = await prisma.$transaction(async (tx: any) => {
      // Update the Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      // 🛑 STOCK RESTORATION LOGIC
      const isRestocking = status === "CANCELLED" || status === "RETURNED";
      const wasAlreadyRestocked =
        currentOrder.status === "CANCELLED" || currentOrder.status === "RETURNED";

      if (isRestocking && !wasAlreadyRestocked) {
        const items = currentOrder.items as any[];

        for (const item of items) {
          if (item.size) {
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
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return updatedOrder;
    });

    // --- 4. TRIGGER EMAILS BASED ON STATUS ---
    const emailPromises: Promise<any>[] = [];

    switch (status) {
      case 'PROCESSING': 
        emailPromises.push(sendOrderProcessing(result));
        break;
      case "CANCELLED":
        emailPromises.push(sendOrderCancelled(result));
        break;
      case "SHIPPED":
        emailPromises.push(sendShippingUpdate(result));
        break;
      case "DELIVERED":
        emailPromises.push(sendOrderDelivered(result));
        break;
      case "RETURNED":
        emailPromises.push(sendOrderReturned(result));
        break;
    }

    // Fire-and-forget (don’t block response)
    Promise.all(emailPromises).catch((err) =>
      console.error("Status Email Failed", err)
    );

    return res.json({ success: true, order: result });
  } catch (error) {
    return next(error);
  }
};