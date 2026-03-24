import Queue from 'bull';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Redis client factory for Bull queue (creates new clients for each purpose)
const createBullRedisClient = () => {
  return new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });
};

// Create email queue with Bull-compatible Redis clients
const emailQueue = new Queue('email', {
  createClient: createBullRedisClient,
});

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  orderNumber?: string;
  emailType: 'confirmation' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded' | 'admin-alert';
}

// Queue an email to be sent
export const queueEmail = async (emailData: EmailJob): Promise<void> => {
  try {
    await emailQueue.add(emailData, {
      attempts: 5, // Retry 5 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds
      },
      removeOnComplete: true,
      timeout: 30000, // 30 second timeout per attempt
    });
    console.log(`📧 Email queued: ${emailData.emailType} to ${emailData.to}`);
  } catch (error) {
    console.error('❌ Failed to queue email:', error);
    throw error;
  }
};

// Process queued emails
emailQueue.process(async (job) => {
  const { to, subject, html, orderNumber, emailType } = job.data as EmailJob;

  try {
    // Check if email was already sent (prevent duplicates)
    const existing = await prisma.emailLog.findFirst({
      where: {
        recipientEmail: to,
        subject: subject,
        orderNumber: orderNumber || null,
        status: 'sent',
      },
    });

    if (existing) {
      console.log(`✅ Email already sent: ${emailType} to ${to}`);
      return { skipped: true, reason: 'Email already sent' };
    }

    // Log attempt
    const emailLog = await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        subject,
        html, // Store HTML for retry capability
        emailType,
        orderNumber: orderNumber || null,
        status: 'processing',
        attemptNumber: job.attemptsMade,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"Upul International" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    // Mark as sent
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    console.log(`✅ Email sent successfully: ${emailType} to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Email failed (Attempt ${job.attemptsMade}/5):`, error);

    // Log failure
    await prisma.emailLog.create({
      data: {
        recipientEmail: to,
        subject,
        html, // Store HTML for retry capability
        emailType,
        orderNumber: orderNumber || null,
        status: 'failed',
        attemptNumber: job.attemptsMade,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error; // Trigger retry
  }
});

// Handle permanently failed emails (after all retries exhausted)
emailQueue.on('failed', async (job, err) => {
  const { to, orderNumber, emailType } = job.data as EmailJob;

  console.error(
    `❌ Email permanently failed after ${job.attemptsMade} attempts: ${emailType} to ${to}`,
    err.message
  );

  // Mark as permanently failed
  await prisma.emailLog.updateMany({
    where: {
      recipientEmail: to,
      subject: job.data.subject,
      status: 'processing',
    },
    data: {
      status: 'permanently_failed',
      failureReason: err.message,
    },
  });

  // Optionally send alert to admin
  if (process.env.ADMIN_EMAIL) {
    try {
      await transporter.sendMail({
        from: `"System" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `⚠️ Critical: Email delivery failed - ${emailType}`,
        html: `
          <p>Email delivery has permanently failed after 5 retry attempts.</p>
          <p><strong>Email Type:</strong> ${emailType}</p>
          <p><strong>Recipient:</strong> ${to}</p>
          <p><strong>Order:</strong> ${orderNumber || 'N/A'}</p>
          <p><strong>Error:</strong> ${err.message}</p>
          <p>Please check the admin panel to manually resend this email.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send admin alert:', error);
    }
  }
});

// Handle job completion
emailQueue.on('completed', (job) => {
  console.log(`✨ Email job completed: ${job.id}`);
});

// Health check
export const getEmailQueueStats = async () => {
  const counts = await emailQueue.getJobCounts();
  const failed = await emailQueue.getFailed(0, 100);

  return {
    active: counts.active,
    waiting: counts.waiting,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    failedJobs: failed.length,
  };
};

// Get failed emails for admin panel
export const getFailedEmails = async (skip = 0, take = 10) => {
  return prisma.emailLog.findMany({
    where: {
      status: 'permanently_failed',
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take,
  });
};

// Retry a failed email
export const retryFailedEmail = async (emailLogId: string) => {
  const emailLog = await prisma.emailLog.findUnique({
    where: { id: emailLogId },
  });

  if (!emailLog) {
    throw new Error('Email log not found');
  }

  if (!emailLog.html) {
    throw new Error('Email HTML not found in log - cannot retry');
  }

  // Re-queue the email with stored HTML
  await queueEmail({
    to: emailLog.recipientEmail,
    subject: emailLog.subject,
    html: emailLog.html, // Use stored HTML
    orderNumber: emailLog.orderNumber || undefined,
    emailType: emailLog.emailType as any,
  });

  // Reset status
  await prisma.emailLog.update({
    where: { id: emailLogId },
    data: {
      status: 'processing',
      attemptNumber: 0,
    },
  });
};

export default emailQueue;