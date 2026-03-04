import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

// 1. Create a Category (Root or Child)
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, slug, parentId } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId || undefined,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    return next(error);
  }
};

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { parentId } = req.query;

    const whereClause: any = {};

    if (parentId && typeof parentId === "string") {
      whereClause.parentId = parentId;
    } else {
      whereClause.parentId = { isSet: false };
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        children: true,
      },
    });

    return res.json(categories);
  } catch (error) {
    return next(error);
  }
};
// 1. Helper: Deletes children first, then the item itself
const deleteCategoryRecursive = async (categoryId: string) => {
  // Find immediate children
  const children = await prisma.category.findMany({
    where: { parentId: categoryId }
  });

  // Recursively delete each child FIRST
  for (const child of children) {
    await deleteCategoryRecursive(child.id);
  }

  // Once all children are gone, it's safe to delete the parent
  await prisma.category.delete({
    where: { id: categoryId }
  });
};

// 2. The Main Controller Function
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if category exists first
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Run the recursive delete
    await deleteCategoryRecursive(id);

    return res.json({ message: "Category and all sub-categories deleted successfully" });
  } catch (error) {
    return next(error);
  }
};