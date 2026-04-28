import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import slugify from "slugify";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces with -
    .replace(/^-+|-+$/g, ""); // Trim - from start/end
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, parentId, sortOrder } = req.body;

    const safeParentId =
      parentId === "null" || parentId === "" ? null : parentId;

    //  1. CHECK FOR DUPLICATE NAME AT THE SAME LEVEL
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" }, // Case-insensitive check
        ...(safeParentId
          ? { parentId: safeParentId }
          : { OR: [{ parentId: { isSet: false } }, { parentId: null }] }),
      },
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ error: "A category with this name already exists at this level." });
    }
    
    //slug createe validation
    let slug = generateSlug(name);
    if (safeParentId) {
      // Append a chunk of the parentId so "Shirts" under "Men" and "Women" have different slugs
      slug = `${slug}-${safeParentId.slice(-6)}`;
    } else {
      // If root, just in case, append a tiny random string if it clashes
      const slugExists = await prisma.category.findFirst({ where: { slug } });
      if (slugExists) slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug, //valdation
        sortOrder: Number(sortOrder),
        parent: safeParentId ? { connect: { id: safeParentId } } : undefined,
      },
    });
    // error pass
    return res.status(201).json(category);
  } catch (error) {
    if ((error as any).code === "P2002") {  
      return res
        .status(400)
        .json({ error: "A category with this slug or name globally exists." });
    }
    return next(error);
  }
};
export const getCategories = async (req: Request, res: Response) => {
  const { parentId, roots } = req.query;

  const where: any = {};

  if (roots === "true") {
    // 🧠 THE FIX: Check for both "Null" and "Missing" (isSet: false)
    where.OR = [
      { parentId: { isSet: false } }, // Field is completely missing
      { parentId: { equals: null } }, // Field exists but is set to null
    ];
  } else if (parentId) {
    where.parentId = String(parentId);
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { children: true } }, // (or subCategories, match your schema)
    },
  });

  // Anti-cache headers
  res.setHeader("Cache-Control", "no-store, max-age=0");

  res.json(categories);
};

// 1. Helper: Deletes children first, then the item itself
const deleteCategoryRecursive = async (categoryId: string) => {
  // Find immediate children
  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
  });

  // Recursively delete each child FIRST
  for (const child of children) {
    await deleteCategoryRecursive(child.id);
  }

  // Once all children are gone, it's safe to delete the parent
  await prisma.category.delete({
    where: { id: categoryId },
  });
};

// 2. The Main Controller Function
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    // Check if category exists first
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Run the recursive delete
    await deleteCategoryRecursive(id);

    return res.json({
      message: "Category and all sub-categories deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;

    // Get the current category to know its parentId
    const currentCategory = await prisma.category.findUnique({ where: { id } });
    if (!currentCategory) return res.status(404).json({ error: "Not found" });

    const data: any = {};
    
    if (name && name !== currentCategory.name) {
      //  1. CHECK FOR DUPLICATE NAME AT THE SAME LEVEL
      const existingCategory = await prisma.category.findFirst({
        where: {
          id: { not: id }, // Exclude the one we are updating
          name: { equals: name, mode: "insensitive" },
          ...(currentCategory.parentId
            ? { parentId: currentCategory.parentId }
            : { OR: [{ parentId: { isSet: false } }, { parentId: null }] }),
        },
      });

      if (existingCategory) {
        return res
          .status(400)
          .json({ error: "A category with this name already exists at this level." });
      }

      data.name = name;
      
      //  2. Update Slug safely
      let slug = slugify(name, { lower: true, strict: true });
      if (currentCategory.parentId) {
        slug = `${slug}-${currentCategory.parentId.slice(-6)}`;
      }
      data.slug = slug;
    }

    if (sortOrder !== undefined) {
      data.sortOrder = parseInt(sortOrder);
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

export const reorderCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    // ⚡ FIX: Use Promise.all instead of $transaction to avoid P2034 Deadlock
    // This updates all items in parallel without locking the entire collection
    await Promise.all(
      items.map((item: any) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const getCategoryPath = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const path = [];
    
    let currentId: string | null = id; 

    while (currentId) {
      const categoryItem: { id: string; name: string; parentId: string | null } | null = await prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true }
      });

      if (!categoryItem) break;

      path.unshift(categoryItem); 
      
      currentId = categoryItem.parentId; 
    }

    return res.json(path);
  } catch (error) {
    return next(error);
  }
};

//  GENERATE CATEGORY ANALYTICS REPORT (PDF/Excel)
export const generateCategoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startDate, endDate, format } = req.query;

    // 1. Build Date Filter for Orders
    const orderWhereClause: any = {
      // Only count orders that were actually processed/paid
      status: { notIn: ["CANCELLED", "RETURNED", "REFUNDED"] }
    };

    if (startDate || endDate) {
      orderWhereClause.createdAt = {};
      if (startDate) orderWhereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // Include the entire end day
        orderWhereClause.createdAt.lte = end;
      }
    }

    // 2. Fetch Valid Orders
    const orders = await prisma.order.findMany({
      where: orderWhereClause,
      select: { items: true }
    });

    // 3. Aggregate Products Sold
    // We first need to sum up how many of each PRODUCT was sold, 
    // and how much revenue it generated.
    const productStats = new Map<string, { quantity: number; revenue: number }>();
    const uniqueProductIds = new Set<string>();

    orders.forEach((order) => {
      const items = order.items as any[];
      if (items && Array.isArray(items)) {
        items.forEach((item) => {
          if (!item.productId) return;
          
          uniqueProductIds.add(item.productId);
          
          const existing = productStats.get(item.productId) || { quantity: 0, revenue: 0 };
          productStats.set(item.productId, {
            quantity: existing.quantity + Number(item.quantity),
            revenue: existing.revenue + (Number(item.price) * Number(item.quantity))
          });
        });
      }
    });

    // 4. Fetch Product Category Mappings
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(uniqueProductIds) } },
      select: { 
        id: true, 
        category: { select: { id: true, name: true } } 
      }
    });

    // Create a quick lookup map: productId -> Category Data
    const productCategoryMap = new Map();
    products.forEach(p => {
      if (p.category) {
        productCategoryMap.set(p.id, p.category);
      }
    });

    // 5. Aggregate by Category
    const categoryStats = new Map<string, any>();

    productStats.forEach((stats, productId) => {
      const category = productCategoryMap.get(productId);
      const catId = category ? category.id : "uncategorized";
      const catName = category ? category.name : "Uncategorized / Deleted";

      const existingCat = categoryStats.get(catId) || { 
        name: catName, 
        itemsSold: 0, 
        grossRevenue: 0 
      };

      categoryStats.set(catId, {
        name: catName,
        itemsSold: existingCat.itemsSold + stats.quantity,
        grossRevenue: existingCat.grossRevenue + stats.revenue
      });
    });

    // 6. Convert to Array and Sort by Items Sold (Descending)
    const formattedCategories = Array.from(categoryStats.values()).sort(
      (a, b) => b.itemsSold - a.itemsSold
    );

    // ==========================================
    // 7. GENERATE EXCEL
    // ==========================================
    if (format === "EXCEL") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Category Analytics");

      worksheet.columns = [
        { header: "Category Name", key: "name", width: 40 },
        { header: "Total Units Sold", key: "itemsSold", width: 20 },
        { header: "Gross Revenue (Rs.)", key: "grossRevenue", width: 25 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.addRows(formattedCategories);

      worksheet.getColumn("grossRevenue").numFmt = '"Rs." #,##0.00';

      res.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.attachment("Upuls_Category_Analytics.xlsx");

      await workbook.xlsx.write(res);
      return res.end();
    }

    // ==========================================
    // 8. GENERATE PDF
    // ==========================================
    if (format === "PDF") {
      const doc = new PDFDocument({ margin: 40 });

      res.header("Content-Type", "application/pdf");
      res.attachment("Upuls_Category_Analytics.pdf");

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
      doc.fontSize(16).font("Helvetica-Bold").text("Category Analytics Report", { align: "right" });
      doc.moveDown(1.5);

      // --- Filter Meta Data ---
      const dateText = (startDate && endDate) 
        ? `${new Date(startDate as string).toLocaleDateString()} to ${new Date(endDate as string).toLocaleDateString()}` 
        : "All Time";
      
      doc.fontSize(10).font("Helvetica").text(`Time Period: ${dateText}`);
      doc.text(`Total Categories Sold: ${formattedCategories.length}`);
      doc.moveDown();

      // --- Column Setup ---
      const colX = {
        name: 40,
        itemsSold: 280,
        revenue: 420,
      };

      const drawHeaders = () => {
        doc.fontSize(10).font("Helvetica-Bold");
        const headerY = doc.y;

        doc.text("Category Name", colX.name, headerY);
        doc.text("Total Units Sold", colX.itemsSold, headerY);
        doc.text("Gross Revenue", colX.revenue, headerY);

        doc.y = headerY + 15;
        doc.moveTo(40, doc.y).lineTo(570, doc.y).stroke();
        doc.y += 10;
        doc.font("Helvetica");
      };

      drawHeaders();

      // --- Table Rows ---
      formattedCategories.forEach((item: any) => {
        let y = doc.y;

        if (y > 700) {
          doc.addPage();
          drawHeaders();
          y = doc.y;
        }

        doc.fontSize(9);
        doc.text(item.name, colX.name, y);
        doc.text(`${item.itemsSold} Units`, colX.itemsSold, y);
        doc.text(`Rs. ${item.grossRevenue.toLocaleString()}`, colX.revenue, y);

        doc.y = y + 20;
      });

      doc.end();
      return;
    }

    return res.status(400).json({ message: "Invalid format requested. Use EXCEL or PDF." });
  } catch (error) {
    console.error("Error generating category analytics:", error);
    return next(error);
  }
};