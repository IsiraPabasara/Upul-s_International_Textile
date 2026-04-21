import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPromotionalBroadcast } from './email.service';

const prisma = new PrismaClient();

// 1. Get all subscribers (with search and pagination)
export const getAdminSubscribers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string; // 'active', 'inactive', or 'all'

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const [subscribers, total, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstname: true, lastname: true } } } // Join user info if they are registered!
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } })
    ]);

    return res.json({
      success: true,
      data: subscribers,
      stats: { total, activeCount },
      pagination: { page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
  }
};

// 2. Manually toggle a user's subscription status
export const toggleSubscriberAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    
    if (!subscriber) return res.status(404).json({ success: false, message: 'Subscriber not found' });

    const updated = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { isActive: !subscriber.isActive }
    });

    return res.json({ success: true, message: `Subscriber ${updated.isActive ? 'activated' : 'deactivated'}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle subscriber' });
  }
};

// 3. Broadcast Email to all ACTIVE subscribers
export const broadcastNewsletter = async (req: Request, res: Response) => {
  try {
    const { subject, htmlContent } = req.body;

    if (!subject || !htmlContent) {
      return res.status(400).json({ success: false, message: 'Subject and content are required.' });
    }

    // Fetch ONLY active subscribers
    const activeSubscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true }
    });

    if (activeSubscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'No active subscribers found.' });
    }

    // Loop and queue (Bull handles the rate limiting automatically!)
    for (const sub of activeSubscribers) {
      await sendPromotionalBroadcast(sub.email, subject, htmlContent);
    }

    return res.json({ 
      success: true, 
      message: `Successfully queued broadcast to ${activeSubscribers.length} subscribers!` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to broadcast newsletter' });
  }
};
