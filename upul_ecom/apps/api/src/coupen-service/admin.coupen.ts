import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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

// --- UPDATE COUPON ---
export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, type, value, minOrderAmount, limitPerUser, maxUses, expiresAt, isPublic } = req.body;

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrderAmount: parseFloat(minOrderAmount),
        limitPerUser: limitPerUser ? parseInt(limitPerUser) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPublic
      },
    });

    return res.json(updated);
  } catch (error) {
    if ((error as any).code === "P2002") {
      return res.status(400).json({ message: "This coupon code is already in use." });
    }
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

// --- GENERATE COUPON REPORT (PDF/Excel) ---
export const generateCouponReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, type, format } = req.query;

    // 1. Build the Prisma WHERE clause for type filter only
    const whereClause: any = {};

    if (type === "PERCENTAGE") whereClause.type = "PERCENTAGE";
    if (type === "FIXED") whereClause.type = "FIXED";

    // 2. Fetch coupon data from DB
    const dbCoupons = await prisma.coupon.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // 3. Format and filter by status
    const formattedCoupons = dbCoupons
      .map((item: any) => {
        const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
        let currentStatus = item.isActive ? "Active" : "Inactive";
        if (item.isActive && isExpired) currentStatus = "Expired";

        const formattedValue =
          item.type === "PERCENTAGE"
            ? `${item.value}%`
            : `Rs. ${item.value.toLocaleString()}`;

        const usageStats = item.maxUses
          ? `${item.usedCount} / ${item.maxUses}`
          : `${item.usedCount} (Unltd)`;

        return {
          code: item.code,
          type: item.type === "PERCENTAGE" ? "Percentage" : "Fixed Amount",
          value: formattedValue,
          minOrder: item.minOrderAmount ? `Rs. ${item.minOrderAmount.toLocaleString()}` : "None",
          usage: usageStats,
          status: currentStatus,
          isActive: item.isActive,
          isExpired: isExpired,
        };
      })
      .filter((item: any) => {
        // Filter by status
        if (status === "ACTIVE") {
          // Active: isActive = true AND NOT expired
          return item.isActive && !item.isExpired;
        }
        if (status === "INACTIVE") {
          // Inactive: isActive = false OR expired
          return !item.isActive || item.isExpired;
        }
        // ALL: show everything
        return true;
      })
      .map((item: any) => {
        // Remove helper fields before formatting for report
        const { isActive, isExpired, ...cleanItem } = item;
        return cleanItem;
      });

    // ==========================================
    // 4. GENERATE EXCEL
    // ==========================================
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Coupons Report");

      // Define your columns
      worksheet.columns = [
        { header: "Coupon Code", key: "code", width: 25 },
        { header: "Discount Type", key: "type", width: 20 },
        { header: "Discount Value", key: "value", width: 20 },
        { header: "Min Order Req.", key: "minOrder", width: 20 },
        { header: "Usage (Used/Max)", key: "usage", width: 20 },
        { header: "Status", key: "status", width: 15 },
      ];

      // Make the header row bold
      worksheet.getRow(1).font = { bold: true };

      // Add all coupon data
      worksheet.addRows(formattedCoupons);

      // Add Conditional Formatting for Status
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const statusCell = row.getCell("status");
        if (statusCell.value === "Inactive" || statusCell.value === "Expired") {
          statusCell.font = { color: { argb: "FF9CA3AF" }, italic: true };
        } else if (statusCell.value === "Active") {
          statusCell.font = { color: { argb: "FF059669" }, bold: true }; // Emerald Green
        }
      });

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Upuls_Coupon_Report.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    }

    // ==========================================
    // 5. GENERATE PDF
    // ==========================================
    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 40 });

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Coupon_Report.pdf");

      doc.pipe(res);

      // --- CUSTOM LOGO DRAWING (Top Left) ---
      const logoX = 40;
      const logoY = 40;

      doc.font("Times-Bold").fontSize(34).fillColor("#1a1a3a").text("U", logoX, logoY);
      doc.lineWidth(2).moveTo(logoX + 26, logoY + 8).lineTo(logoX + 54, logoY + 8).stroke("#1a1a3a");
      doc.moveTo(logoX + 26, logoY + 14).lineTo(logoX + 41, logoY + 14).stroke("#1a1a3a");
      doc.font("Times-Bold").fontSize(12).fillColor("#dc2626").text("PUL'S", logoX + 26, logoY + 19);
      doc.lineWidth(0.5).moveTo(logoX, logoY + 36).lineTo(logoX + 65, logoY + 36).stroke("#d1d5db");
      doc.font("Helvetica-Bold").fontSize(6).fillColor("#6b7280").text("I N T E R N A T I O N A L", logoX, logoY + 40);

      doc.fillColor("black").lineWidth(1); // Reset

      // --- PDF Header Titles (Top Right) ---
      doc.y = 50;
      doc.fontSize(16).font("Helvetica-Bold").text("Coupon Analytics Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Filter Meta Data ---
      const displayStatus = status === "ALL" || !status ? "All Statuses" : status;
      const displayType = type === "ALL" || !type ? "All Types" : type;
      
      doc.fontSize(10).font("Helvetica").text(`Filters: ${displayStatus} | ${displayType}`);
      doc.text(`Total Coupons: ${formattedCoupons.length}`);
      doc.moveDown();

      // --- Column Setup ---
      const colX = {
        code: 40,
        type: 160,
        value: 260,
        minOrder: 350,
        usage: 440,
        status: 510,
      };

      const drawHeaders = () => {
        doc.fontSize(9).font("Helvetica-Bold");
        const headerY = doc.y;

        doc.text("Coupon Code", colX.code, headerY);
        doc.text("Type", colX.type, headerY);
        doc.text("Discount", colX.value, headerY);
        doc.text("Min Order", colX.minOrder, headerY);
        doc.text("Usage", colX.usage, headerY);
        doc.text("Status", colX.status, headerY);

        doc.y = headerY + 15;
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
        doc.y += 10;
        doc.font("Helvetica");
      };

      drawHeaders();

      // --- Table Rows ---
      formattedCoupons.forEach((item: any) => {
        let y = doc.y;

        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.fontSize(8);
        doc.font("Helvetica-Bold").text(item.code, colX.code, y).font("Helvetica");
        doc.text(item.type, colX.type, y);
        doc.text(item.value, colX.value, y);
        doc.text(item.minOrder, colX.minOrder, y);
        doc.text(item.usage, colX.usage, y);

        // Color coding status
        if (item.status === "Inactive" || item.status === "Expired") {
          doc.fillColor("#9ca3af"); // Gray
        } else if (item.status === "Active") {
          doc.fillColor("#059669"); // Emerald Green
        }
        
        doc.text(item.status, colX.status, y);
        doc.fillColor("black"); // Reset

        doc.y = y + 20;
      });

      doc.end();
      return;
    }

    return res.status(400).json({ message: "Invalid format requested. Use EXCEL or PDF." });
  } catch (error) {
    console.error("Error generating coupon report:", error);
    return next(error);
  }
};