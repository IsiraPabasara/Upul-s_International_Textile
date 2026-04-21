import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import ExcelJS from "exceljs";

import {
  sendOrderCancelled,
  sendOrderDelivered,
  sendOrderProcessing,
  sendOrderReturned,
  sendShippingUpdate,
} from "../email-service/email.service";
import PDFDocument from "pdfkit";

// 📊 GET TOTAL ORDER STATS (For the top cards)
export const getAdminOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
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
      RETURNED: 0, // 🟢 Now separate
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

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Extract query params (with safe defaults)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = (req.query.filter as string) || "ALL";
    const search = (req.query.search as string) || "";

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
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // 3. Fire both queries at the exact same time for maximum speed
    const [totalOrders, orders] = await prisma.$transaction([
      prisma.order.count({ where: whereClause }), // Gets total matches for pagination math
      prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
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
        hasMore: page * limit < totalOrders,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 2. GET SINGLE ORDER DETAILS
export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { firstname: true, lastname: true, email: true } },
      },
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
  next: NextFunction,
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
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!currentOrder)
      return res.status(404).json({ message: "Order not found" });

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
        currentOrder.status === "CANCELLED" ||
        currentOrder.status === "RETURNED";

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
      case "PROCESSING":
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
      console.error("Status Email Failed", err),
    );

    return res.json({ success: true, order: result });
  } catch (error) {
    return next(error);
  }
};

// GENERATE ORDER REPORT (PDF/Excel)
export const generateOrderReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startDate, endDate, status, format } = req.query;

    // 1. Build the Prisma WHERE clause
    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // 2. Fetch real data from MongoDB via your Prisma client
    const dbOrders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }, // Newest first
    });

    // 3. Format the data so it looks clean on the final document
    const formattedOrders = dbOrders.map((order: any) => {
      // Safely parse the JSON shippingAddress
      let shipping: any = {};
      try {
        shipping =
          typeof order.shippingAddress === "string"
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress;
      } catch (e) {
        shipping = {};
      }

      // Fallback to email if name doesn't exist
      const customerName = shipping?.firstname
        ? `${shipping.firstname} ${shipping.lastname || ""}`.trim()
        : order.email;

      return {
        orderNumber: order.orderNumber,
        customerName: customerName,
        email: order.email,
        totalAmount: order.totalAmount,
        discount: order.discountAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        date: order.createdAt.toLocaleDateString(),
      };
    });

    // 4. GENERATE CSV
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Orders");

      // 1. Define your columns
      worksheet.columns = [
        { header: "Order Number", key: "orderNumber", width: 15 },
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Email", key: "email", width: 35 }, 
        { header: "Discount", key: "discount", width: 12 },
        { header: "Status", key: "status", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 18 },
        { header: "Date", key: "date", width: 20 }, 
        { header: "Total Amount", key: "totalAmount", width: 20 }, // Made slightly wider for the Rs. text
      ];

      // Make the header row bold
      worksheet.getRow(1).font = { bold: true };

      // 2. Add all your order data
      worksheet.addRows(formattedOrders);

      // ==========================================
      // --- GRAND TOTAL LOGIC ---
      // ==========================================
      
      // Calculate the total by looping through the orders
      const grandTotal = formattedOrders.reduce((sum, order) => {
        return sum + (Number(order.totalAmount) || 0);
      }, 0);

      // Add a blank row just to give it some breathing room (optional but looks clean)
      worksheet.addRow({});

      // Add the final row at the bottom. 
      // We map "Grand Total:" to the 'date' column so it sits right next to the amount!
      const totalRow = worksheet.addRow({
        date: "Grand Total:",
        totalAmount: grandTotal
      });

      // Make that whole final row bold
      totalRow.font = { bold: true };
      
      // Align the "Grand Total:" text to the right side of its cell so it hugs the number
      totalRow.getCell('date').alignment = { horizontal: 'right' };

      // Tell Excel to format the entire Total Amount column with commas and "Rs."
      worksheet.getColumn('totalAmount').numFmt = '"Rs." #,##0.00';
      // ==========================================

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.attachment("Upuls_Order_Report.xlsx");
      
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 50 });

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Order_Report.pdf");

      doc.pipe(res);

      // ==========================================
      // --- CUSTOM LOGO DRAWING (Top Left) ---
      // ==========================================
      const logoX = 50;
      const logoY = 40;

      // 1. The big "U"
      doc
        .font("Times-Bold")
        .fontSize(34)
        .fillColor("#1a1a3a")
        .text("U", logoX, logoY);

      // 2. The two little graphic lines
      doc
        .lineWidth(2)
        .moveTo(logoX + 26, logoY + 8)
        .lineTo(logoX + 54, logoY + 8)
        .stroke("#1a1a3a");
      doc
        .moveTo(logoX + 26, logoY + 14)
        .lineTo(logoX + 41, logoY + 14)
        .stroke("#1a1a3a");

      // 3. The red "PUL'S"
      doc
        .font("Times-Bold")
        .fontSize(12)
        .fillColor("#dc2626")
        .text("PUL'S", logoX + 26, logoY + 19);

      // 4. The top border for "International"
      doc
        .lineWidth(0.5)
        .moveTo(logoX, logoY + 36)
        .lineTo(logoX + 65, logoY + 36)
        .stroke("#d1d5db");

      // 5. The small spaced "INTERNATIONAL"
      doc
        .font("Helvetica-Bold")
        .fontSize(6)
        .fillColor("#6b7280")
        .text("I N T E R N A T I O N A L", logoX, logoY + 40);

      // CRITICAL: Reset colors and line widths so the rest of the PDF is normal!
      doc.fillColor("black").lineWidth(1);
      // ==========================================

      // --- PDF Header Titles (Top Right) ---
      doc.y = 50; // Align with the top of the logo
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Order Management Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Filter Meta Data ---
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Status Filter: ${status || "ALL"}`);
      doc.text(
        `Date Range: ${startDate || "All Time"} to ${endDate || "Today"}`,
      );
      doc.text(`Total Orders: ${formattedOrders.length}`);
      doc.moveDown();

      const colX = {
        orderId: 50,
        customer: 100,
        email: 195,
        status: 360,
        payment: 435,
        amount: 490,
      };

      // --- Helper Function to Draw Headers ---
      const drawHeaders = () => {
        doc.fontSize(10).font("Helvetica-Bold");
        const headerY = doc.y;

        doc.text("Order ID", colX.orderId, headerY);
        doc.text("Customer", colX.customer, headerY);
        doc.text("Email", colX.email, headerY);
        doc.text("Status", colX.status, headerY);
        doc.text("Payment", colX.payment, headerY);
        doc.text("Amount", colX.amount, headerY);

        doc.y = headerY + 15;
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.y += 10;
        doc.font("Helvetica");
      };

      // Draw headers for the first page
      drawHeaders();

      // --- Table Rows ---
      let grandTotal = 0;

      formattedOrders.forEach((order: any) => {
        let y = doc.y;

        // Page break protection
        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.text(`#${order.orderNumber}`, colX.orderId, y);

        const name = order.customerName || "N/A";
        const shortName =
          name.length > 15 ? name.substring(0, 15) + "..." : name;
        doc.text(shortName, colX.customer, y);

        const email = order.email || order.customerEmail || "N/A";
        const shortEmail =
          email.length > 28 ? email.substring(0, 26) + "..." : email;
        doc.text(shortEmail, colX.email, y);

        doc.text(order.status, colX.status, y);
        doc.text(order.paymentMethod, colX.payment, y);

        // Calculate amount and add to grand total
        const amount = Number(order.totalAmount) || 0;
        grandTotal += amount;
        doc.text(`Rs. ${amount}`, colX.amount, y);

        // Manually push Y down
        doc.y = y + 20;
      });

      // ==========================================
      // --- RIGHT-ALIGNED GRAND TOTAL FOOTER ---
      // ==========================================

      // CRITICAL FIX: Check if we have enough room for the 50px footer block.
      // Standard A4 height is 842. If we are past 680, we don't have enough safe space.
      if (doc.y > 680) {
        doc.addPage();
        // If we add a new page, we don't need to moveDown because we are already at the top
      } else {
        doc.moveDown(1); // Give breathing room from the table only if on the same page
      }

      const formattedTotal = grandTotal.toLocaleString("en-US" ,{
        maximumFractionDigits:2,
        minimumFractionDigits:2
      });

      // 1. Lock Y for the TOP line
      const topLineY = doc.y;

      // Draw TOP line (Only spanning from X=350 to X=550)
      doc.moveTo(350, topLineY).lineTo(560, topLineY).stroke();

      // 2. Lock Y for the Text
      const textY = topLineY + 10;

      // Print the text aligned with the Payment and Amount columns
      doc.font("Helvetica-Bold");
      doc.text("Grand Total:", 380, textY);
      doc.text(`Rs. ${formattedTotal}`, colX.amount, textY);

      // 3. Lock Y for the BOTTOM line
      const bottomLineY = textY + 20;

      // Draw BOTTOM line (Only spanning from X=350 to X=550)
      doc.moveTo(350, bottomLineY).lineTo(560, bottomLineY).stroke();

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ message: "Invalid format requested. Use CSV or PDF." });
  } catch (error) {
    console.error("Error generating report:", error);
    // Tallying with your error handling pattern:
    return next(error);
  }
};
