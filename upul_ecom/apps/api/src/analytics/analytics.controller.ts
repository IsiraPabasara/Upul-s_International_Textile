import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { range = "weekly", startYear, endYear } = req.query;
    const today = new Date();

    let currentStartDate = new Date();
    let currentEndDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let groupByType: "day" | "month" | "year" = "day";

    if (range === "custom") {
      const sYear = Math.max(Number(startYear) || 2021, 2021);
      const eYear = Number(endYear) || today.getFullYear();
      currentStartDate = new Date(sYear, 0, 1);
      currentEndDate = new Date(eYear, 11, 31, 23, 59, 59);
      const yearDiff = eYear - sYear + 1;
      prevStartDate = new Date(sYear - yearDiff, 0, 1);
      prevEndDate = new Date(sYear - 1, 11, 31, 23, 59, 59);
      groupByType = yearDiff > 1 ? "year" : "month";
    } else if (range === "yearly") {
      currentStartDate = new Date(today.getFullYear(), 0, 1);
      currentEndDate = new Date(today.getFullYear(), 11, 31);
      prevStartDate = new Date(today.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(today.getFullYear() - 1, 11, 31);
      groupByType = "month";
    } else if (range === "monthly") {
      currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
      currentEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
      groupByType = "day";
    } else {
      // Weekly logic helper
      const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
      };
      currentStartDate = getStartOfWeek(today);
      currentEndDate = new Date(currentStartDate);
      currentEndDate.setDate(currentStartDate.getDate() + 6);
      currentEndDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(currentStartDate);
      prevStartDate.setDate(currentStartDate.getDate() - 7);
      prevEndDate = new Date(prevStartDate);
      prevEndDate.setDate(prevStartDate.getDate() + 6);
      prevEndDate.setHours(23, 59, 59, 999);
      groupByType = "day";
    }

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueCurrent,
      ordersCurrent,
      customersCurrent,
      productsCurrent,
      revenuePrev,
      ordersPrev,
      customersPrev,
      productsPrev,
      chartOrders,
      chartNewProducts,
      recentTransactions,
    ] = await prisma.$transaction([
      // Totals
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.count(),
      prisma.users.count({ where: { role: "user" } }),
      prisma.product.count(),

      // Current Period
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: currentStartDate, lte: currentEndDate },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.order.count({
        where: { createdAt: { gte: currentStartDate, lte: currentEndDate } },
      }),
      prisma.users.count({
        where: {
          createdAt: { gte: currentStartDate, lte: currentEndDate },
          role: "user",
        },
      }),
      prisma.product.count({
        where: { createdAt: { gte: currentStartDate, lte: currentEndDate } },
      }),

      // Previous Period
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.order.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),
      prisma.users.count({
        where: {
          createdAt: { gte: prevStartDate, lte: prevEndDate },
          role: "user",
        },
      }),
      prisma.product.count({
        where: { createdAt: { gte: prevStartDate, lte: prevEndDate } },
      }),

      // Charts
      prisma.order.findMany({
        where: {
          createdAt: { gte: currentStartDate, lte: currentEndDate },
          status: { not: "CANCELLED" },
        },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.product.findMany({
        where: { createdAt: { gte: currentStartDate, lte: currentEndDate } },
        select: { createdAt: true },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstname: true, lastname: true, email: true } },
        },
      }),
    ]);

    // Get Top Seling 5 Categories with the Total
    const rawCategoryStats = await prisma.order.aggregateRaw({
      pipeline: [
        {
          $match: {
            createdAt: {
              $gte: { $date: currentStartDate.toISOString() },
              $lte: { $date: currentEndDate.toISOString() },
            },
            status: { $ne: "CANCELLED" },
          },
        },
        { $unwind: "$items" },
        {
          $project: {
            productIdObj: { $toObjectId: "$items.productId" },
            lineTotal: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
        {
          $lookup: {
            from: "Product",
            localField: "productIdObj",
            foreignField: "_id",
            as: "productData",
          },
        },
        { $unwind: "$productData" },
        {
          $lookup: {
            from: "Category",
            localField: "productData.categoryId",
            foreignField: "_id",
            as: "categoryData",
          },
        },
        { $unwind: "$categoryData" },
        {
          $group: {
            _id: "$categoryData.name",
            totalSales: { $sum: "$lineTotal" },
          },
        },
        { $sort: { totalSales: -1 } }, //Descending
        { $limit: 5 },
      ],
    });

    const salesByCategory = (rawCategoryStats as unknown as any[]).map(
      (stat) => ({
        name: stat._id || "Uncategorized",
        value: stat.totalSales,
      }),
    );

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 99 : 0;
      const rawTrend = ((curr - prev) / prev) * 100;
      const cappedTrend = Math.max(-99, Math.min(99, rawTrend));
      return parseFloat(cappedTrend.toFixed(1));
    };

    const periodTotal = revenueCurrent._sum.totalAmount || 0;
    const periodTrend = calcTrend(
      periodTotal,
      revenuePrev._sum.totalAmount || 0,
    );
    const lifetimeTotal = totalRevenue._sum.totalAmount || 0;

    const getLocalDayKey = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const historyMap = new Map<
      string,
      { revenue: number; orders: number; products: number; label: string }
    >();
    let iteratorDate = new Date(currentStartDate);
    while (iteratorDate <= currentEndDate) {
      let key = "",
        label = "";
      if (groupByType === "year") {
        key = iteratorDate.getFullYear().toString();
        label = key;
        iteratorDate.setFullYear(iteratorDate.getFullYear() + 1);
      } else if (groupByType === "month") {
        key = `${iteratorDate.getFullYear()}-${iteratorDate.getMonth() + 1}`;
        label = iteratorDate.toLocaleString("default", { month: "short" });
        if (range === "custom")
          label += ` '${iteratorDate.getFullYear().toString().slice(-2)}`;
        iteratorDate.setMonth(iteratorDate.getMonth() + 1);
      } else {
        key = getLocalDayKey(iteratorDate);
        label =
          range === "monthly"
            ? iteratorDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : iteratorDate.toLocaleDateString("en-US", { weekday: "short" });
        iteratorDate.setDate(iteratorDate.getDate() + 1);
      }
      historyMap.set(key, { revenue: 0, orders: 0, products: 0, label });
    }

    const fillHistory = (items: any[], type: "orders" | "products") => {
      items.forEach((item) => {
        const d = new Date(item.createdAt);
        let key = "";
        if (groupByType === "year") key = d.getFullYear().toString();
        else if (groupByType === "month")
          key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        else key = getLocalDayKey(d);

        if (historyMap.has(key)) {
          const entry = historyMap.get(key)!;
          if (type === "orders") {
            entry.revenue += item.totalAmount;
            entry.orders += 1;
          } else {
            entry.products += 1;
          }
          historyMap.set(key, entry);
        }
      });
    };
    fillHistory(chartOrders, "orders");
    fillHistory(chartNewProducts, "products");

    const chartHistory = Array.from(historyMap.values()).map((data) => ({
      name: data.label,
      revenue: data.revenue,
      orders: data.orders,
      products: data.products,
      customers: Math.ceil(data.orders * 0.8),
    }));

    res.json({
      periodTotal,
      periodTrend,
      lifetimeTotal,
      revenue: {
        value: totalRevenue._sum.totalAmount || 0,
        trend: periodTrend,
        history: chartHistory.map((d) => ({ name: d.name, value: d.revenue })),
      },
      orders: {
        value: totalOrders,
        trend: calcTrend(ordersCurrent, ordersPrev),
        history: chartHistory.map((d) => ({ name: d.name, value: d.orders })),
      },
      customers: {
        value: totalCustomers,
        trend: calcTrend(customersCurrent, customersPrev),
        history: chartHistory.map((d) => ({
          name: d.name,
          value: d.customers,
        })),
      },
      products: {
        value: totalProducts,
        trend: calcTrend(productsCurrent, productsPrev),
        history: chartHistory.map((d) => ({ name: d.name, value: d.products })),
      },
      recentTransactions: recentTransactions.map((order: any) => ({
        id: order.id,
        customer: order.user
          ? `${order.user.firstname} ${order.user.lastname}`.trim()
          : "Guest",
        email: order.user?.email || "",
        amount: order.totalAmount,
        status: order.status,
        date: order.createdAt,
      })),
      salesByCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { range = "all_time" } = req.query;
    let startDate = new Date();
    const endDate = new Date();

    if (range === "weekly") startDate.setDate(endDate.getDate() - 7);
    else if (range === "monthly") startDate.setMonth(endDate.getMonth() - 1);
    else if (range === "yearly")
      startDate.setFullYear(endDate.getFullYear() - 1);
    else startDate = new Date("2020-01-01"); 

    const topProductsRaw = await prisma.order.aggregateRaw({
      pipeline: [
        {
          $match: {
            createdAt: {
              $gte: { $date: startDate.toISOString() },
              $lte: { $date: endDate.toISOString() },
            },
            status: { $ne: "CANCELLED" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $addFields: {
            productObjId: { $toObjectId: "$_id" },
          },
        },
        {
          $lookup: {
            from: "Product",
            localField: "productObjId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: {
            path: "$productDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
      ],
    });

    const formattedProducts = (topProductsRaw as unknown as any[])
      .map((item) => {
        if (!item.productDetails) return null;

        return {
          id: item._id,
          name: item.productDetails.name,
          price: item.productDetails.price,
          brand: item.productDetails.brand || "Generic",
          stock: item.productDetails.stock,
          image: item.productDetails.images?.[0]?.url || "/placeholder.png",
          totalSold: item.totalSold,
        };
      })
      .filter(Boolean);

    res.json(formattedProducts);
  } catch (error) {
    next(error);
  }
};

export const getTopCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { range = "all_time" } = req.query;
    let startDate = new Date();
    const endDate = new Date();

    if (range === "weekly") {
      startDate.setDate(endDate.getDate() - 7);
    } else if (range === "monthly") {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (range === "yearly") {
      startDate.setFullYear(endDate.getFullYear() - 1);
    } else {
      startDate = new Date("2020-01-01"); 
    }

    const topUsersRaw = await prisma.order.groupBy({
      by: ["userId"],
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true, 
      },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: "CANCELLED" },
        userId: { not: null }, 
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: 5,
    });

    const userIds = topUsersRaw
      .map((u: any) => u.userId)
      .filter((id: any): id is string => id !== null);

    const userDetails = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
      },
    });

    const formattedCustomers = topUsersRaw
      .map((item: any) => {
        const user = userDetails.find((u: any) => u.id === item.userId);
        if (!user) return null;

        return {
          id: user.id,
          name: `${user.firstname} ${user.lastname}`.trim(),
          email: user.email,
          image: "", 
          totalSpent: item._sum.totalAmount || 0,
          ordersCount: item._count.id || 0,
        };
      })
      .filter(Boolean);

    res.json(formattedCustomers);
  } catch (error) {
    next(error);
  }
};
