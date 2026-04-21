import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import { deleteFromImageKit } from "../imagekit-service/imagekit.controller";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Helper function to generate unique slug
const generateUniqueSlug = async (name: string): Promise<string> => {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)+/g, ""); // Remove leading/trailing hyphens

  let finalSlug = baseSlug;
  let counter = 1;

  while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return finalSlug;
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;

    // 1. Generate SKU if missing
    let finalSKU = data.sku;
    if (!finalSKU) {
      finalSKU = await generateNextSku();
    }

    // 2. Generate Unique Slug
    const finalSlug = await generateUniqueSlug(data.name);

    // 3. Check for Duplicates
    const existing = await prisma.product.findUnique({
      where: { sku: finalSKU },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Error generating unique SKU, please try again." });
    }

    // 4. CALCULATE STOCK LOGIC
    let finalStock = 0;
    if (
      data.variants &&
      Array.isArray(data.variants) &&
      data.variants.length > 0
    ) {
      finalStock = data.variants.reduce(
        (sum: number, v: any) => sum + Number(v.stock || 0),
        0,
      );
    } else {
      finalStock = Number(data.stock || 0);
    }

    // 5. Create Product
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: finalSlug,
        sku: finalSKU,
        description: data.description,
        price: parseFloat(data.price),
        stock: finalStock,
        availability: finalStock > 0,
        visible: data.visible !== undefined ? data.visible : true,

        brand: data.brand || null,

        // 🟢 Just save the raw string directly
        country: data.country || null,

        images: data.images,
        colors: data.colors || [],
        categoryId: data.categoryId,

        sizeChartUrl: data.sizeChartUrl || null,

        sizeType: data.sizeType,
        variants: data.variants || [],
        discountType: data.discountType || "NONE",
        discountValue: parseFloat(data.discountValue || 0),
        isNewArrival: data.isNewArrival || false,
      },
    });
    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return next(error);
  }
};

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { sku: { contains: String(search), mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categoryId = String(categoryId);
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductBySku = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({
      where: { sku },
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (error) {
    return next(error);
  }
};

export const updateProductBySku = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sku } = req.params;
    const {
      name,
      description,
      price,
      stock,
      categoryId,
      country, // 🟢 Changed from countryId to country
      images,
      variants,
      discountType,
      discountValue,
      brand,
      sizeType,
      visible,
      colors,
      isNewArrival,
      sizeChartUrl,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { sku } });
    if (!existingProduct)
      return res.status(404).json({ error: "Product not found" });

    const formattedVariants = Array.isArray(variants)
      ? variants.map((v: any) => ({ size: v.size, stock: Number(v.stock) }))
      : [];

    let finalStock =
      formattedVariants.length > 0
        ? formattedVariants.reduce((sum: number, v: any) => sum + v.stock, 0)
        : Number(stock || 0);

    const updatedProduct = await prisma.product.update({
      where: { sku },
      data: {
        name,
        description,
        price: Number(price),
        brand: brand || null,

        // 🟢 FIXED: Removed 'data.' prefix and used 'country' from destructuring
        country: country || null,

        sizeChartUrl: sizeChartUrl || null,

        sizeType,
        stock: finalStock,
        availability: finalStock > 0,
        visible: visible !== undefined ? visible : existingProduct.visible,
        isNewArrival:
          isNewArrival !== undefined
            ? isNewArrival
            : existingProduct.isNewArrival,
        categoryId: categoryId || existingProduct.categoryId,
        images: images || existingProduct.images,
        colors: colors || existingProduct.colors,
        variants: formattedVariants,
        discountType: discountType || "NONE",
        discountValue: Number(discountValue || 0),
      },
    });

    return res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update Error:", error);
    if ((error as any).code === "P2002") {
      return res.status(400).json({ error: "Duplicate value found." });
    }
    return next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sku } = req.params;
    const product = await prisma.product.findUnique({
      where: { sku },
      select: { images: true },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const idsToDelete = product.images
      .map((img: any) => img.fileId)
      .filter(Boolean);
    await deleteFromImageKit(idsToDelete);

    await prisma.product.delete({ where: { sku } });
    return res.json({ success: true, message: "Product and images wiped!" });
  } catch (error) {
    return next(error);
  }
};

export const toggleVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sku } = req.params;
    const currentProduct = await prisma.product.findUnique({
      where: { sku },
      select: { visible: true },
    });
    if (!currentProduct)
      return res.status(404).json({ error: "Product not found" });

    const product = await prisma.product.update({
      where: { sku },
      data: { visible: !currentProduct.visible },
      select: { sku: true, visible: true },
    });
    return res.json({ success: true, visible: product.visible });
  } catch (error) {
    return next(error);
  }
};

const generateNextSku = async (prefix = "SKU") => {
  const lastProduct = await prisma.product.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!lastProduct || !lastProduct.sku) return `${prefix}-1`;
  const skuParts = lastProduct.sku.split("-");
  const lastNumber = parseInt(skuParts[skuParts.length - 1]);
  return isNaN(lastNumber)
    ? `${prefix}-${Date.now()}`
    : `${prefix}-${lastNumber + 1}`;
};

export const getProductCountries = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 🟢 Fetching from your new Country model
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
    });
    return res.json(countries);
  } catch (error) {
    return next(error);
  }
};

// 📋 GENERATE PRODUCT LIST REPORT (PDF/Excel)
export const generateProductReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { visibility, format } = req.query;

    // 1. Build the Prisma WHERE clause for visibility filter
    const whereClause: any = {};

    if (visibility === "ACTIVE") {
      whereClause.visible = true;
    } else if (visibility === "DRAFT") {
      whereClause.visible = false;
    }

    // 2. Fetch product data from DB, including the linked Category
    const dbProducts = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true, // Need this to get the actual category name!
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Format the data and calculate final prices
    const formattedProducts = dbProducts.map((item: any) => {
      const basePrice = Number(item.price) || 0;
      let finalPrice = basePrice;

      // Calculate discounted price based on your schema's discount logic
      const discountVal = Number(item.discountValue) || 0;
      if (item.discountType === "PERCENTAGE" && discountVal > 0) {
        finalPrice = basePrice - basePrice * (discountVal / 100);
      } else if (item.discountType !== "NONE" && discountVal > 0) {
        // Assuming the other enum value is a fixed amount deduction
        finalPrice = basePrice - discountVal;
      }

      // Ensure price never drops below 0 just in case
      finalPrice = Math.max(0, finalPrice);

      return {
        sku: item.sku || "N/A",
        productName: item.name,
        category: item.category?.name || "Uncategorized",
        brand: item.brand || "-",
        basePrice: basePrice,
        discountedPrice: finalPrice,
        status: item.visible ? "Active" : "Draft",
      };
    });

    // ==========================================
    // 4. GENERATE EXCEL
    // ==========================================
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Product List");

      // Define your columns
      worksheet.columns = [
        { header: "SKU", key: "sku", width: 15 },
        { header: "Product Name", key: "productName", width: 40 },
        { header: "Category", key: "category", width: 20 },
        { header: "Brand", key: "brand", width: 15 },
        { header: "Base Price", key: "basePrice", width: 15 },
        { header: "Final Price", key: "discountedPrice", width: 15 },
        { header: "Status", key: "status", width: 12 },
      ];

      // Make the header row bold
      worksheet.getRow(1).font = { bold: true };

      // Add all product data
      worksheet.addRows(formattedProducts);

      // Add all product data
      worksheet.addRows(formattedProducts);

      // ==========================================
      // --- EXCEL CONDITIONAL STYLING ---
      // ==========================================
      worksheet.eachRow((row, rowNumber) => {
        // Skip the header row (row 1)
        if (rowNumber === 1) return;

        // Grab the specific cells in this row using the keys we defined
        const basePriceCell = row.getCell("basePrice");
        const finalPriceCell = row.getCell("discountedPrice");
        const statusCell = row.getCell("status");

        // Grab the raw numbers to compare
        const base = Number(basePriceCell.value);
        const final = Number(finalPriceCell.value);

        // 1. Strikethrough base price if discounted!
        if (base > final) {
          basePriceCell.font = {
            strike: true,
            color: { argb: "FF9CA3AF" }, // ARGB hex for the Tailwind Gray
          };

          // Make the final price bold to make it pop!
          finalPriceCell.font = {
            bold: true, 
          };
        }

        // 2. Gray out the Draft status just like we did in the PDF
        if (statusCell.value === "Draft") {
          statusCell.font = {
            color: { argb: "FF9CA3AF" },
            italic: true, // Added italic just for extra style in Excel
          };
        }
      });
      // ==========================================

      // Format currency columns
      worksheet.getColumn("basePrice").numFmt = '"Rs." #,##0.00';
      worksheet.getColumn("discountedPrice").numFmt = '"Rs." #,##0.00';

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Upuls_Product_Catalog.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    }

    // ==========================================
    // 5. GENERATE PDF
    // ==========================================
    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 40 }); // Slightly tighter margin for more space

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Product_Catalog.pdf");

      doc.pipe(res);

      // --- CUSTOM LOGO DRAWING (Top Left) ---
      const logoX = 40;
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
        .text("Product Catalog Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Filter Meta Data ---
      const displayStatus =
        visibility === "ACTIVE"
          ? "Active Only"
          : visibility === "DRAFT"
            ? "Drafts Only"
            : "All Products";
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Visibility Filter: ${displayStatus}`);
      doc.text(`Total Products: ${formattedProducts.length}`);
      doc.moveDown();

      // --- Column Setup ---
      // Tweaked heavily to fit 7 columns on an A4 page
      const colX = {
        sku: 40,
        product: 100,
        category: 260,
        brand: 340,
        basePrice: 400,
        finalPrice: 460,
        status: 530,
      };

      const drawHeaders = () => {
        doc.fontSize(9).font("Helvetica-Bold"); // Slightly smaller text to fit
        const headerY = doc.y;

        doc.text("SKU", colX.sku, headerY);
        doc.text("Product Name", colX.product, headerY);
        doc.text("Category", colX.category, headerY);
        doc.text("Brand", colX.brand, headerY);
        doc.text("Base Rs.", colX.basePrice, headerY);
        doc.text("Final Rs.", colX.finalPrice, headerY);
        doc.text("Status", colX.status, headerY);

        doc.y = headerY + 15;
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke(); // Wider line
        doc.y += 10;
        doc.font("Helvetica");
      };

      drawHeaders();

      // --- Table Rows ---
      formattedProducts.forEach((item: any) => {
        let y = doc.y;

        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.fontSize(8); // Smaller font for dense data
        doc.text(item.sku, colX.sku, y);

        const name = item.productName || "N/A";
        const shortName =
          name.length > 30 ? name.substring(0, 28) + "..." : name;
        doc.text(shortName, colX.product, y);

        const category = item.category || "-";
        const shortCat =
          category.length > 12 ? category.substring(0, 10) + ".." : category;
        doc.text(shortCat, colX.category, y);

        const brand = item.brand || "-";
        const shortBrand =
          brand.length > 10 ? brand.substring(0, 8) + ".." : brand;
        doc.text(shortBrand, colX.brand, y);

        // Strikethrough base price if it's discounted!
        if (item.basePrice > item.discountedPrice) {
          doc.fillColor("#9ca3af"); // Gray

          // 🟢 Added { strike: true } as the 4th parameter!
          doc.text(`${item.basePrice.toLocaleString()}`, colX.basePrice, y, {
            strike: true,
          });

          doc.fillColor("black"); // Reset color
        } else {
          // 🟢 Added { strike: false } just to be completely safe so it doesn't leak to normal prices
          doc.text(`${item.basePrice.toLocaleString()}`, colX.basePrice, y, {
            strike: false,
          });
        }

        doc.font("Helvetica-Bold");
        doc.text(
          `${item.discountedPrice.toLocaleString()}`,
          colX.finalPrice,
          y,
        );
        doc.font("Helvetica");

        // Green for active, Gray for draft
        if (item.status === "Draft") doc.fillColor("#9ca3af");
        doc.text(item.status, colX.status, y);
        doc.fillColor("black");

        doc.y = y + 20;
      });

      // No Grand Totals needed for a product catalog!

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ message: "Invalid format requested. Use EXCEL or PDF." });
  } catch (error) {
    console.error("Error generating product report:", error);
    return next(error);
  }
};
