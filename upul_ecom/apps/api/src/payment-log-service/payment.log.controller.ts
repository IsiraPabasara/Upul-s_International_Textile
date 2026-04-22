import { NextFunction, Response } from "express";
import prisma from "../../../../packages/libs/prisma";

// api/admin/payment-logs
export const getPaymentLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Basic Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    console.log('🔍 Fetching payment logs - Page:', page, 'Skip:', skip, 'Limit:', limit);

    const [logs, total] = await Promise.all([
      prisma.paymentLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderId: true,
          paymentId: true,
          statusCode: true,
          status: true,
          createdAt: true,
        }
      }),
      prisma.paymentLog.count()
    ]);

    console.log('✅ Payment logs found:', logs.length, 'Total:', total);

    if (!logs || logs.length === 0) {
      return res.json({
        logs: [],
        totalPages: 0,
        total: 0,
        message: 'No payment logs found'
      });
    }

    return res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      total,
      currentPage: page
    });
  } catch (error) {
    console.error('❌ Error fetching payment logs:', error);
    return next(error);
  }
};