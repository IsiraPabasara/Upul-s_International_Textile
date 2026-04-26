import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export const getInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      stock_status,
      filter_type,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { sku: { contains: String(search), mode: "insensitive" } },
        ],
      });
    }

    if (stock_status === "out_of_stock") {
      where.AND.push({
        OR: [{ stock: 0 }, { variants: { some: { stock: 0 } } }],
      });
    }

    if (filter_type === "low_stock") {
      where.AND.push({
        OR: [
          {
            stock: { gte: 0, lt: 10 },
            variants: { none: {} },
          },
          {
            variants: {
              some: { stock: { gte: 0, lt: 10 } },
            },
          },
        ],
      });
    }

    const [total, rawProducts, globalStats, allProductsValue] =
      await prisma.$transaction([

        prisma.product.count({ where }),

        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            variants: true,
            images: true,
            updatedAt: true,
            price: true,
          },
        }),

        prisma.product.aggregate({
          _sum: { stock: true },
          _count: { id: true },
        }),

        prisma.product.findMany({
          select: { stock: true, price: true, variants: true },
        }),

      ]);

    const outOfStockCount = allProductsValue.reduce((count: number, p: any) => {
      if (Array.isArray(p.variants) && p.variants.length > 0) {
        //Find out how many variants are out of stock and add to count
        const emptyVariants = (p.variants as any[]).filter(
          (v: any) => v.stock === 0,
        ).length;
        return count + emptyVariants;
      } else {
        return count + (p.stock === 0 ? 1 : 0);
      }
    }, 0);

    const totalInventoryValue = allProductsValue.reduce(
      (acc: number, curr: any) => {
        const price = Number(curr.price) || 0;
        const stock = Number(curr.stock) || 0;
        return acc + price * stock;
      },
      0,
    );

    const products = rawProducts.map((p: any) => ({
      ...p, //Save every single property it has and modify only the image
      images:
        Array.isArray(p.images) && p.images.length > 0 ? [p.images[0]] : [],
    }));

    return res.json({
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: {
        totalStock: globalStats._sum.stock || 0,
        outOfStock: outOfStockCount,
        totalValue: totalInventoryValue,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const bulkUpdateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: "Invalid updates array" });
    }

    const updatesBySku: Record<string, any[]> = {};

    updates.forEach((update) => {
      if (!updatesBySku[update.sku]) { // Check if the SKU key already exists in the updatesBySku object
        updatesBySku[update.sku] = []; // If it doesn't exist, initialize it with an empty array
      }
      updatesBySku[update.sku].push(update); 
    });

    const results = await prisma.$transaction(async (tx: any) => {

      const skuKeys = Object.keys(updatesBySku); // Get unique SKUs that need to be updated

      return Promise.all(

        skuKeys.map(async (sku) => {

          const productUpdates = updatesBySku[sku]; // All updates for this SKU

          const product = await tx.product.findUnique({ where: { sku } });
          if (!product) throw new Error(`Product ${sku} not found`);

          let currentVariants = Array.isArray(product.variants)
            ? [...product.variants] // Clone the variants array without modifying the original database object directly
            : [];
          let currentStock = Number(product.stock);
          let updatedData: any = {};

          for (const update of productUpdates) {

            const stockVal = Number(update.newStock);

            if (update.variantSize && currentVariants.length > 0) {
              const vIndex = currentVariants.findIndex(
                (v: any) => v.size === update.variantSize,
              );
              if (vIndex > -1) {
                currentVariants[vIndex] = {
                  ...currentVariants[vIndex],
                  stock: stockVal,
                };
              }
            } else {
              currentStock = stockVal;
            }
          }

          if (currentVariants.length > 0) {
            const totalStock = currentVariants.reduce(
              (sum, v: any) => sum + Number(v.stock),
              0,
            );
            updatedData = {
              variants: currentVariants,
              stock: totalStock,
              availability: totalStock > 0,
            };
          } else {
            updatedData = {
              stock: currentStock,
              availability: currentStock > 0,
            };
          }

          return tx.product.update({
            where: { sku },
            data: updatedData,
          });
        }),
      );
    });

    return res.json({ success: true, count: results.length });
  } catch (error) {
    return next(error);
  }
};

// 📦 GENERATE INVENTORY REPORT (PDF/Excel)
export const generateInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, format } = req.query;

    // 1. Build the Prisma WHERE clause
    // We need to check BOTH the main stock AND the stock inside the variants array
    const whereClause: any = {};

    if (status === "LOW_STOCK") {
      whereClause.OR = [
        { stock: { lt: 10, gt: 0 } },
        { variants: { some: { stock: { lt: 10, gt: 0 } } } },
      ];
    } else if (status === "OUT_OF_STOCK") {
      whereClause.OR = [{ stock: 0 }, { variants: { some: { stock: 0 } } }];
    }

    // 2. Fetch inventory data from DB
    const dbInventory = await prisma.product.findMany({
      where: whereClause,
      // Removed the stock orderBy here because we have multiple stocks per product now.
      // We will sort it in memory later if needed.
    });

    // 3. Format the data for the reports
    // We use a flat array because one product might become 3 different rows (for XS, S, M)
    const formattedInventory: any[] = [];

    dbInventory.forEach((product: any) => {
      const price = Number(product.price) || 0;

      // SCENARIO A: The product has specific size variants
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          const stock = Number(variant.stock) || 0;

          // CRITICAL: If the user filtered by "LOW_STOCK", we only want to add the
          // specific variant sizes that are actually low, not the healthy ones!
          if (status === "LOW_STOCK" && (stock >= 10 || stock === 0)) return;
          if (status === "OUT_OF_STOCK" && stock > 0) return;

          const assetValue = price * stock;
          let stockStatus = "In Stock";
          if (stock === 0) stockStatus = "Out of Stock";
          else if (stock < 10) stockStatus = "Low Stock";

          formattedInventory.push({
            sku: product.sku || "N/A",
            productName: product.name,
            variant: variant.size || "-", // "XS", "S", "M"
            status: stockStatus,
            stockLevel: stock,
            unitPrice: price,
            assetValue: assetValue,
          });
        });
      }
      // SCENARIO B: The product has NO variants, use the root stock
      else {
        const stock = Number(product.stock) || 0;

        // Apply filters to root stock
        if (status === "LOW_STOCK" && (stock >= 10 || stock === 0)) return;
        if (status === "OUT_OF_STOCK" && stock > 0) return;

        const assetValue = price * stock;
        let stockStatus = "In Stock";
        if (stock === 0) stockStatus = "Out of Stock";
        else if (stock < 10) stockStatus = "Low Stock";

        formattedInventory.push({
          sku: product.sku || "N/A",
          productName: product.name,
          variant: "-",
          status: stockStatus,
          stockLevel: stock,
          unitPrice: price,
          assetValue: assetValue,
        });
      }
    });

    // (Optional) Sort the final list so the lowest stock items are at the top of the report
    formattedInventory.sort((a, b) => a.stockLevel - b.stockLevel);

    // ==========================================
    // 4. GENERATE EXCEL
    // ==========================================
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Inventory");

      // Define your columns
      worksheet.columns = [
        { header: "SKU", key: "sku", width: 15 },
        { header: "Product Name", key: "productName", width: 40 },
        { header: "Variant", key: "variant", width: 15 },
        { header: "Status", key: "status", width: 18 },
        { header: "Stock Level", key: "stockLevel", width: 15 },
        { header: "Unit Price", key: "unitPrice", width: 20 },
        { header: "Asset Value", key: "assetValue", width: 25 },
      ];

      // Make the header row bold
      worksheet.getRow(1).font = { bold: true };

      // Add all inventory data
      worksheet.addRows(formattedInventory);

      // --- GRAND TOTAL LOGIC ---
      const grandTotalAssetValue = formattedInventory.reduce((sum, item) => {
        return sum + item.assetValue;
      }, 0);

      // Add a blank row for breathing room
      worksheet.addRow({});

      // Add the final row at the bottom
      const totalRow = worksheet.addRow({
        unitPrice: "Total Asset Value:",
        assetValue: grandTotalAssetValue,
      });

      totalRow.font = { bold: true };
      totalRow.getCell("unitPrice").alignment = { horizontal: "right" };

      // Format currency columns
      worksheet.getColumn("unitPrice").numFmt = '"Rs." #,##0.00';
      worksheet.getColumn("assetValue").numFmt = '"Rs." #,##0.00';

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Upuls_Inventory_Report.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    }

    // ==========================================
    // 5. GENERATE PDF
    // ==========================================
    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 50 });

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Inventory_Report.pdf");

      doc.pipe(res);

      // --- CUSTOM LOGO DRAWING (Top Left) ---
      const logoX = 50;
      const logoY = 40;

      doc
        .font("Times-Bold")
        .fontSize(34)
        .fillColor("#1a1a3a")
        .text("U", logoX, logoY);
      doc
        .lineWidth(2)
        .moveTo(logoX + 26, logoY + 8)
        .lineTo(logoX + 54, logoY + 8)
        .stroke("#1a1a3a");
      doc
        .moveTo(logoX + 26, logoY + 14)
        .lineTo(logoX + 41, logoY + 14)
        .stroke("#1a1a3a");
      doc
        .font("Times-Bold")
        .fontSize(12)
        .fillColor("#dc2626")
        .text("PUL'S", logoX + 26, logoY + 19);
      doc
        .lineWidth(0.5)
        .moveTo(logoX, logoY + 36)
        .lineTo(logoX + 65, logoY + 36)
        .stroke("#d1d5db");
      doc
        .font("Helvetica-Bold")
        .fontSize(6)
        .fillColor("#6b7280")
        .text("I N T E R N A T I O N A L", logoX, logoY + 40);

      doc.fillColor("black").lineWidth(1); // Reset

      // --- PDF Header Titles (Top Right) ---
      doc.y = 50;
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Inventory & Asset Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Filter Meta Data ---
      const displayStatus =
        status === "LOW_STOCK"
          ? "Low Stock (< 10)"
          : status === "OUT_OF_STOCK"
            ? "Out of Stock"
            : "All Inventory";
      doc.fontSize(10).font("Helvetica").text(`Stock Filter: ${displayStatus}`);
      doc.text(`Total Items Listed: ${formattedInventory.length}`);
      doc.moveDown();

      // --- Column Setup ---
      const colX = {
        sku: 50,
        product: 100,
        variant: 270,
        stock: 330,
        price: 390,
        value: 460,
      };

      const drawHeaders = () => {
        doc.fontSize(10).font("Helvetica-Bold");
        const headerY = doc.y;

        doc.text("SKU", colX.sku, headerY);
        doc.text("Product Name", colX.product, headerY);
        doc.text("Variant", colX.variant, headerY);
        doc.text("Qty", colX.stock, headerY);
        doc.text("Unit Price", colX.price, headerY);
        doc.text("Asset Value", colX.value, headerY);

        doc.y = headerY + 15;
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.y += 10;
        doc.font("Helvetica");
      };

      drawHeaders();

      // --- Table Rows ---
      let grandTotalAsset = 0;

      formattedInventory.forEach((item: any) => {
        let y = doc.y;

        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.text(item.sku, colX.sku, y);

        const name = item.productName || "N/A";
        const shortName =
          name.length > 28 ? name.substring(0, 26) + "..." : name;
        doc.text(shortName, colX.product, y);

        doc.text(item.variant, colX.variant, y);

        // Highlight low/out of stock in PDF
        if (item.stockLevel === 0)
          doc.fillColor("#dc2626"); // Red
        else if (item.stockLevel < 10) doc.fillColor("#d97706"); // Orange

        doc.text(item.stockLevel.toString(), colX.stock, y);
        doc.fillColor("black"); // Reset to black

        doc.text(`Rs. ${item.unitPrice.toLocaleString()}`, colX.price, y);

        grandTotalAsset += item.assetValue;
        doc.text(`Rs. ${item.assetValue.toLocaleString()}`, colX.value, y);

        doc.y = y + 20;
      });

      // --- RIGHT-ALIGNED GRAND TOTAL FOOTER ---
      if (doc.y > 680) {
        doc.addPage();
      } else {
        doc.moveDown(1);
      }

      const formattedTotal = grandTotalAsset.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });

      const topLineY = doc.y;
      doc.moveTo(330, topLineY).lineTo(560, topLineY).stroke();

      const textY = topLineY + 10;
      doc.font("Helvetica-Bold");
      doc.text("Total Asset Value:", 350, textY);
      doc.text(`Rs. ${formattedTotal}`, colX.value, textY, {width:100});

      const bottomLineY = textY + 20;
      doc.moveTo(330, bottomLineY).lineTo(560, bottomLineY).stroke();

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ message: "Invalid format requested. Use EXCEL or PDF." });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return next(error);
  }
};
