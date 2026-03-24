import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getEmailQueueStats, retryFailedEmail } from './email-queue'; // removed getFailedEmails import as we query prisma directly now for flexibility

const prisma = new PrismaClient();

// Get email queue statistics
export const getEmailQueueStatus = async (req: Request, res: Response) => {
  try {
    const stats = await getEmailQueueStats();
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching email queue stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch email queue statistics',
    });
  }
};

// ⚡ UPDATED: Get Email Logs with Search & Filtering
export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || 'all';
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    // Build the dynamic filter
    const where: any = {};

    // 1. Status Filter
    if (status === 'failed') {
      where.status = { in: ['failed', 'permanently_failed'] };
    } else if (status === 'sent') {
      where.status = 'sent';
    } 
    // if status is 'all', we don't apply a status filter

    // 2. Search Filter (Recipient, Subject, Order #)
    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Run count and query in parallel
    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Newest first
      }),
      prisma.emailLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        emails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch email logs',
    });
  }
};

// Get email log history for an order
export const getOrderEmailHistory = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const emailLogs = await prisma.emailLog.findMany({
      where: {
        orderNumber,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: emailLogs,
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch email history',
    });
  }
};

// Manually retry a failed email
export const retryFailedEmailManually = async (req: Request, res: Response) => {
  try {
    const { emailLogId } = req.params;

    // Get the email log to find original email data
    const emailLog = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!emailLog) {
      return res.status(404).json({
        success: false,
        error: 'Email log not found',
      });
    }

    // Retry the email
    await retryFailedEmail(emailLogId);

    return res.json({
      success: true,
      message: `Email retry queued for ${emailLog.recipientEmail}`,
    });
  } catch (error) {
    console.error('Error retrying failed email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retry email',
    });
  }
};

// Get email statistics
export const getEmailStatistics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSent, totalFailed, today, thisMonth, byType] = await Promise.all([
      prisma.emailLog.count({ where: { status: 'sent' } }),
      prisma.emailLog.count({ where: { status: { in: ['failed', 'permanently_failed'] } } }), // Include both fail types
      prisma.emailLog.count({
        where: {
          status: 'sent',
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.emailLog.count({
        where: {
          status: 'sent',
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.emailLog.groupBy({
        by: ['emailType'],
        _count: {
          id: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        totalSent,
        totalFailed,
        sentToday: today,
        sentThisMonth: thisMonth,
        byType,
      },
    });
  } catch (error) {
    console.error('Error fetching email statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch email statistics',
    });
  }
};

// Cleanup old email logs
export const cleanupOldEmailLogs = async (req: Request, res: Response) => {
  try {
    // Default to 30 days if not specified
    const daysToKeep = parseInt(req.query.days as string) || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.emailLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return res.json({
      success: true,
      message: `Deleted ${result.count} email logs older than ${daysToKeep} days`,
    });
  } catch (error) {
    console.error('Error cleaning up email logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup email logs',
    });
  }
};