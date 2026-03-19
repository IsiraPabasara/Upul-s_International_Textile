import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
/**
 * Helper: Recursively finds the ID of a root category and ALL its descendants.
 * Example: Input "Men" -> Returns IDs for ["Men", "Clothing", "Shirts", "Oxford Shirts"]
 */
const getCategoryBranchIds = async (slug: string): Promise<string[]> => {
  // 1. Find the root category by slug
  const root = await prisma.category.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (!root) return [];

  // 2. Fetch all categories to build the tree in memory 
  // (Much faster than recursive DB calls)
  const allCategories = await prisma.category.findMany({
    select: { id: true, parentId: true }
  });

  // 3. Recursive finder
  const findAllChildren = (parentId: string): string[] => {
    const directChildren = allCategories
      .filter((c: any) => c.parentId === parentId)
      .map((c: any) => c.id);
    
    let allDescendants = [...directChildren];
    
    directChildren.forEach((childId: string) => {
      allDescendants = [...allDescendants, ...findAllChildren(childId)];
    });

    return allDescendants;
  };

  // 4. Return Root ID + All Descendant IDs
  return [root.id, ...findAllChildren(root.id)];
};

// export const getShopProducts = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { 
//       category, brand, minPrice, maxPrice, sort, search, isNewArrival, hasDiscount,
//       page = '1', limit = '12'
//     } = req.query;

//     // --- 1. Pagination Setup ---
//     const pageNum = Math.max(1, parseInt(String(page)));
//     const limitNum = Math.max(1, parseInt(String(limit)));
//     const skip = (pageNum - 1) * limitNum;

//     // --- 2. Build Filter (Where Clause) ---
//     const where: any = { 
      
//       visible:true
//     };

//     // A. Text Search (Name, Description, Brand)
//     if (search) {
//       where.OR = [
//         { name: { contains: String(search), mode: 'insensitive' } },
//         { description: { contains: String(search), mode: 'insensitive' } },
//         { brand: { contains: String(search), mode: 'insensitive' } }
//       ];
//     }

//     // B. Category Filter (Deep/Recursive)
//     if (category && category !== 'all') {
//       const categoryIds = await getCategoryBranchIds(String(category));
      
//       if (categoryIds.length > 0) {
//         // Matches products in the requested category OR any of its sub-categories
//         where.categoryId = { in: categoryIds };
//       } else {
//         // If slug is invalid (e.g. ?category=invalid-slug), return 0 results
//         where.categoryId = "000000000000000000000000"; 
//       }
//     }

//     // C. Brand Filter
//     if (brand) {
//       where.brand = { equals: String(brand), mode: 'insensitive' };
//     }

//     // D. Price Range
//     if (minPrice || maxPrice) {
//       where.price = {
//         gte: minPrice ? parseFloat(String(minPrice)) : 0,
//         lte: maxPrice ? parseFloat(String(maxPrice)) : 10000000
//       };
//     }

//     // E. Flags
//     if (isNewArrival === 'true') where.isNewArrival = true;
//     if (hasDiscount === 'true') where.discountType = { not: "NONE" };

//     // --- 3. Sorting Logic ---
//     let orderBy: any = { createdAt: 'desc' }; // Default: Newest

//     switch (sort) {
//       case 'price_low_high':
//       case 'price_asc': 
//         orderBy = { price: 'asc' };
//         break;
//       case 'price_high_low':
//       case 'price_desc':
//         orderBy = { price: 'desc' };
//         break;
//       case 'oldest':
//         orderBy = { createdAt: 'asc' };
//         break;
//       case 'newest':
//         orderBy = { createdAt: 'desc' };
//         break;
//       case 'featured':
//         orderBy = { isNewArrival: 'desc' }; // Prioritize New Arrivals
//         break;
//     }

//     // --- 4. Execute Query (Transaction for count + data) ---
//     const [total, products] = await prisma.$transaction([
//       prisma.product.count({ where }),
//       prisma.product.findMany({
//         where,
//         orderBy,
//         skip,
//         take: limitNum,
//         include: { 
//           category: { select: { name: true, slug: true } } // Return minimal category info
//         }
//       })
//     ]);

//     const totalPages = Math.ceil(total / limitNum);

//     // --- 5. Return Response ---
//     res.json({
//       products,
//       pagination: {
//         total,
//         page: pageNum,
//         limit: limitNum,
//         totalPages
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// };


export const getShopProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      category, brand, minPrice, maxPrice, sort, search, isNewArrival, hasDiscount,
      availability, 
      page = '1', 
      limit = '12' // This will now be overridden by '16' or '24' from the UI
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, parseInt(String(limit)));
    const skip = (pageNum - 1) * limitNum;

    // --- Filter logic ---
    const where: any = { visible: true };

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { brand: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'all') {
      const categoryIds = await getCategoryBranchIds(String(category));
      where.categoryId = categoryIds.length > 0 ? { in: categoryIds } : "000000000000000000000000";
    }

    if (brand) where.brand = { mode: 'insensitive', equals: String(brand) };

    if (minPrice || maxPrice) {
      where.price = {
        gte: minPrice ? parseFloat(String(minPrice)) : 0,
        lte: maxPrice ? parseFloat(String(maxPrice)) : 10000000
      };
    }

    if (isNewArrival === 'true') where.isNewArrival = true;
    if (hasDiscount === 'true') where.discountType = { not: "NONE" };
    if (availability === 'in-stock') where.availability = true;
    else if (availability === 'out-of-stock') where.availability = false;

    // --- Sort logic ---
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'featured': orderBy = { isNewArrival: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    // --- Execution ---
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: { category: { select: { name: true, slug: true } } }
      })
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};