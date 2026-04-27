import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

/**
 * HELPER: Calculates the correct discounted price for a product
 */
const calculateEffectivePrice = (product: any) => {
  let effectivePrice = product.price;

  if (product.discountType === "PERCENTAGE") {
    effectivePrice = product.price - (product.price * (product.discountValue / 100));
  } else if (product.discountType === "FIXED") {
    effectivePrice = product.price - product.discountValue;
  }

  return Math.max(0, effectivePrice);
};

/**
 * HELPER: Ensures data matches Prisma schema and forces number types
 */
const sanitizeItem = (item: any) => ({
  productId: item.productId,
  sku: item.sku,
  name: item.name || "Product",
  price: Number(item.price), 
  originalPrice: item.originalPrice ? Number(item.originalPrice) : Number(item.price),
  image: item.image || "",
  quantity: Number(item.quantity),
  size: item.size || null, 
  color: item.color || null,
});

// --- 1. Get Cart ---
export const getCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    return res.json(cart ? cart.items : []);
  } catch (error) {
    return next(error);
  }
};

// --- 2. Merge Cart (Login Sync) ---
export const mergeCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { localItems } = req.body;

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId, items: [] } });
    }

    let finalItems: any[] = [...(cart.items as any[])];

    if (localItems && Array.isArray(localItems)) {
      for (const localItem of localItems) {
        const existingIndex = finalItems.findIndex((dbItem) => dbItem.sku === localItem.sku);
        if (existingIndex > -1) {
          finalItems[existingIndex].quantity += localItem.quantity;
        } else {
          finalItems.push(localItem);
        }
      }
    }

    const cleanItems = finalItems.map(sanitizeItem);
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: { items: cleanItems }
    });

    return res.json(updatedCart.items);
  } catch (error) {
    return next(error);
  }
};

// --- 3. Add to Cart ---
export const addToCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const item = req.body; 

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId, items: [] } });
    }

    const items = [...(cart.items as any[])];
    const existingIndex = items.findIndex((i) => i.sku === item.sku);

    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    const cleanItems = items.map(sanitizeItem);
    const updated = await prisma.cart.update({
      where: { userId },
      data: { items: cleanItems }
    });

    return res.json(updated.items);
  } catch (error) {
    return next(error);
  }
};

// --- 4. Update Quantity ---
export const updateCartItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { sku, quantity } = req.body;

    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    
    const items = (cart.items as any[]).map(item => {
      if (item.sku === sku) {
        return sanitizeItem({ ...item, quantity });
      }
      return sanitizeItem(item);
    });

    const updated = await prisma.cart.update({
      where: { userId },
      data: { items }
    });

    return res.json(updated.items);
  } catch (error) {
    return next(error);
  }
};

// --- 5. Remove Item ---
export const removeCartItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { sku } = req.params;

    const cart = await prisma.cart.findUniqueOrThrow({ where: { userId } });
    const items = (cart.items as any[])
      .filter(item => item.sku !== sku)
      .map(sanitizeItem);

    const updated = await prisma.cart.update({
      where: { userId },
      data: { items }
    });

    return res.json(updated.items);
  } catch (error) {
    return next(error);
  }
};

// --- 6. Verify Cart (The Security Check) ---
export const verifyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body; 
    const errors: Record<string, string> = {};
    const updatedPrices: Record<string, number> = {}; 
    let isValid = true;

    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId) as any;
      const errorKey = item.sku;

      // Check Existence & Visibility
      if (!product || !product.visible) {
        errors[errorKey] = "Item no longer available";
        isValid = false;
        continue;
      }

      // Calculate the Discounted Price dynamically
      const dbPrice = calculateEffectivePrice(product);
      
      // Price Validation (Compare with Frontend Price)
      if (Number(item.price).toFixed(2) !== dbPrice.toFixed(2)) {
        isValid = false;
        updatedPrices[errorKey] = dbPrice;
        errors[errorKey] = `Price updated to LKR ${dbPrice.toLocaleString()}`;
      }

      // Stock Validation
      if (item.size) {
        const variant = (product.variants as any[]).find((v: any) => v.size === item.size);
        if (!variant || variant.stock < item.quantity) {
          errors[errorKey] = variant ? `Only ${variant.stock} left` : "Size unavailable";
          isValid = false;
        }
      } else {
        if (product.stock < item.quantity) {
          errors[errorKey] = `Only ${product.stock} left`;
          isValid = false;
        }
      }
    }

    return res.json({ isValid, errors, updatedPrices });
  } catch (error) {
    return next(error);
  }
};

// --- 7. Generate Cart Frequency Report (PDF/Excel) ---
export const generateCartFrequencyReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { format } = req.query;

    // 1. Fetch all carts (this naturally only includes registered users since guests use local storage)
    const carts = await prisma.cart.findMany();

    // 2. Aggregate cart items to find frequencies
    // Map to hold our aggregated data keyed by SKU
    const itemStats = new Map<string, any>();

    carts.forEach((cart) => {
      const items = cart.items as any[];
      if (items && Array.isArray(items)) {
        items.forEach((item) => {
          const existing = itemStats.get(item.sku);
          if (existing) {
            existing.totalQuantity += item.quantity;
            existing.cartCount += 1; // Found in another unique cart
          } else {
            itemStats.set(item.sku, {
              sku: item.sku,
              name: item.name || "Unknown Product",
              price: Number(item.price),
              totalQuantity: item.quantity,
              cartCount: 1, // Appears in 1 cart initially
            });
          }
        });
      }
    });

    // 3. Convert Map to Array and Sort by Frequency (Total Quantity Descending)
    const formattedItems = Array.from(itemStats.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    // ==========================================
    // 4. GENERATE EXCEL
    // ==========================================
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cart Frequency");

      // Define your columns
      worksheet.columns = [
        { header: "SKU", key: "sku", width: 15 },
        { header: "Product Name", key: "name", width: 40 },
        { header: "Unit Price", key: "price", width: 15 },
        { header: "Unique Carts", key: "cartCount", width: 15 },
        { header: "Total Qty in Carts", key: "totalQuantity", width: 20 },
      ];

      // Make the header row bold
      worksheet.getRow(1).font = { bold: true };

      // Add all aggregated data
      worksheet.addRows(formattedItems);

      // Format currency column
      worksheet.getColumn("price").numFmt = '"Rs." #,##0.00';

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Upuls_Cart_Frequency_Report.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    }

    // ==========================================
    // 5. GENERATE PDF
    // ==========================================
    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 40 });

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Cart_Frequency_Report.pdf");

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
      doc.fontSize(16).font("Helvetica-Bold").text("Cart Frequency Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Meta Data ---
      doc.fontSize(10).font("Helvetica").text(`Target: Registered Users' Saved Carts`);
      doc.text(`Total Unique Products in Carts: ${formattedItems.length}`);
      doc.moveDown();

      // --- Column Setup ---
      const colX = {
        sku: 40,
        product: 120,
        price: 360,
        cartCount: 440,
        totalQuantity: 510,
      };

      const drawHeaders = () => {
        doc.fontSize(9).font("Helvetica-Bold");
        const headerY = doc.y;

        doc.text("SKU", colX.sku, headerY);
        doc.text("Product Name", colX.product, headerY);
        doc.text("Unit Price", colX.price, headerY);
        doc.text("In Carts", colX.cartCount, headerY);
        doc.text("Total Qty", colX.totalQuantity, headerY);

        doc.y = headerY + 15;
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
        doc.y += 10;
        doc.font("Helvetica");
      };

      drawHeaders();

      // --- Table Rows ---
      formattedItems.forEach((item: any) => {
        let y = doc.y;

        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.fontSize(8);
        doc.text(item.sku, colX.sku, y);

        const name = item.name || "N/A";
        const shortName = name.length > 40 ? name.substring(0, 38) + "..." : name;
        doc.text(shortName, colX.product, y);

        doc.text(`${item.price.toLocaleString()}`, colX.price, y);
        
        // Highlight high-frequency items slightly
        doc.font(item.totalQuantity > 5 ? "Helvetica-Bold" : "Helvetica");
        doc.text(`${item.cartCount}`, colX.cartCount, y);
        doc.text(`${item.totalQuantity}`, colX.totalQuantity, y);
        doc.font("Helvetica"); // Reset

        doc.y = y + 20;
      });

      doc.end();
      return;
    }

    return res
      .status(400)
      .json({ message: "Invalid format requested. Use EXCEL or PDF." });
  } catch (error) {
    console.error("Error generating cart frequency report:", error);
    return next(error);
  }
};