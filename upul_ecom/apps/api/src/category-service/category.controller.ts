import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
import slugify from "slugify";

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

    // 🛡️ SANITIZATION
    const safeParentId =
      parentId === "null" || parentId === "" ? null : parentId;

    // 🐌 SLUG GENERATION (The Fix)
    const slug = generateSlug(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug, // 👈 ADD THIS LINE
        sortOrder: Number(sortOrder),
        parent: safeParentId ? { connect: { id: safeParentId } } : undefined,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    // Check for unique constraint (Duplicate Name OR Slug)
    if ((error as any).code === "P2002") {
      return res
        .status(400)
        .json({ error: "A category with this name already exists." });
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

    const data: any = {};
    if (name) {
      data.name = name;
      data.slug = slugify(name, { lower: true, strict: true });
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