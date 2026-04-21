import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNewsletterWelcome } from './email.service';

const prisma = new PrismaClient();

export const subscribeToNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    // Check if they already exist
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      if (!existingSubscriber.isActive) {
        // Reactivate their subscription if they previously unsubscribed
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true },
        });
        // Queue the welcome email on reactivation as well
        await sendNewsletterWelcome(email);
        return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
      }
      return res.status(400).json({ success: false, message: 'You are already subscribed!' });
    }

    // Create new subscriber
    await prisma.newsletterSubscriber.create({
      data: { email },
    });

    // Queue the welcome email
    await sendNewsletterWelcome(email);

    return res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const unsubscribeFromNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    // Find the subscriber
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Email not found in our newsletter list' });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({ success: false, message: 'This email is already unsubscribed' });
    }

    // Deactivate the subscription instead of deleting (preserves history)
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false },
    });

    return res.json({ success: true, message: 'Successfully unsubscribed from our newsletter' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get current newsletter status for logged-in user (Profile Page)
export const getNewsletterStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { userId },
    });

    return res.json({
      success: true,
      isSubscribed: subscriber ? subscriber.isActive : false,
    });
  } catch (error) {
    console.error('Newsletter status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
};

// Toggle newsletter subscription for logged-in user (Profile Page)
export const toggleNewsletter = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    let subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { userId },
    });

    if (subscriber) {
      // Toggle existing subscription using the unique 'id'
      subscriber = await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { isActive: !subscriber.isActive },
      });
    } else {
      // Create new active subscription linked to user
      subscriber = await prisma.newsletterSubscriber.create({
        data: {
          email: userEmail,
          userId: userId,
          isActive: true,
        },
      });
    }

    return res.json({
      success: true,
      isSubscribed: subscriber.isActive,
      message: subscriber.isActive
        ? 'Subscribed to newsletter!'
        : 'Unsubscribed from newsletter.',
    });
  } catch (error) {
    console.error('Newsletter toggle error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle subscription' });
  }
};
