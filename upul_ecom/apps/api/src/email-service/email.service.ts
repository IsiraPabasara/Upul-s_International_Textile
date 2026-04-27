import { queueEmail } from './email-queue';

const SHOP_EMAIL = process.env.ADMIN_EMAIL || 'upultailors.site@gmail.com'; 
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://api.upuls.lk';
const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.upuls.lk';

// --- Helpers ---

const wrapHtml = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1.brand-title {
            color: #333333;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 15px;
        }
        h2.email-title {
            color: #1a73e8;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 15px;
        }
        p {
            color: #555555;
            font-size: 16px;
            line-height: 1.5;
        }
        .footer {
            font-size: 12px;
            color: #999999;
            margin-top: 30px;
            text-align: center;
            border-top: 1px solid #eeeeee;
            padding-top: 20px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 20px;
                margin: 20px auto;
            }
        }
    </style>
</head>
<body style="background-color: #f6f6f6; margin: 0; padding: 20px 0; font-family: Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f6f6;">
        <tr>
            <td align="center">
                <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: left;">
                    
                    <h1 class="brand-title" style="color: #333333; font-size: 24px; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">UPUL TAILORS (PVT) LTD</h1>
                    <h2 class="email-title" style="color: #333333; font-size: 20px; margin-top: 0; margin-bottom: 15px;">${title}</h2>
                    
                    <div style="color: #555555; font-size: 16px; line-height: 1.5;">
                        ${content}
                    </div>

                    <div class="footer" style="font-size: 12px; color: #999999; margin-top: 30px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        <p style="margin: 0 0 5px; font-size: 12px; color: #999999;">Thank you for shopping with us. Questions? Reply to this email.</p>
                        &copy; ${new Date().getFullYear()} Upul Tailors (PVT) LTD. All rights reserved.
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const getTrackingLink = (order: any) => {
  return order.guestToken 
    ? `${FRONTEND_URL}/track-order?token=${order.guestToken}`
    : `${FRONTEND_URL}/profile/orders/${order.id}`;
};

const getButtonHtml = (link: string, text: string = "View Order") => `
  <div style="text-align: center; margin: 30px 0;">
    <a href="${link}" style="background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">${text}</a>
  </div>
`;

// --- 1. Customer: Order Placed (Invoice) ---
export const sendOrderConfirmation = async (order: any) => {
  try {
    const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const shippingFee = order.shippingFee || 450;
    const discountAmount = order.discountAmount || 0;

    const itemsHtml = order.items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eeeeee; padding: 12px 0; color: #555555;">
        <span>${item.name} <span style="color: #999999; font-size: 14px; margin-left: 5px;">x${item.quantity}</span></span>
        <span style="font-weight: bold; color: #333333;">LKR ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `).join('');

    const trackingLink = getTrackingLink(order);

    const html = wrapHtml(`Order Confirmed #${order.orderNumber}`, `
      <p>Hi there,</p>
      <p>Thank you for your order! We have received it and will verify it shortly via phone call.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #eeeeee;">
        <h3 style="margin-top: 0; color: #333333; font-size: 18px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">INVOICE</h3>
        
        ${itemsHtml}
        
        <div style="padding-top: 15px; font-size: 15px; color: #555555;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Subtotal</span>
            <span style="color: #333333;">LKR ${subtotal.toLocaleString()}</span>
          </div>
          ${discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #d32f2f;">
            <span>Discount</span>
            <span>- LKR ${discountAmount.toLocaleString()}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Shipping</span>
            <span style="color: #333333;">LKR ${shippingFee.toLocaleString()}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 18px; font-weight: bold; border-top: 2px solid #cccccc; padding-top: 15px; color: #000000;">
          <span>Total (${order.paymentMethod === 'PAYHERE' ? 'PAID' : 'COD'})</span>
          <span>LKR ${order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      ${getButtonHtml(trackingLink, "View Order Details")}
    `);

    await queueEmail({
      to: order.email,
      subject: `Invoice & Confirmation #${order.orderNumber}`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'confirmation',
    });
  } catch (error) {
    console.error("Failed to queue confirmation email:", error);
    throw error;
  }
};

// --- 2. Customer: Order Processing Started ---
export const sendOrderProcessing = async (order: any) => {
  try {
    const trackingLink = getTrackingLink(order);

    const html = wrapHtml(`Processing Started`, `
      <p>Good news! We have verified your order <strong>#${order.orderNumber}</strong> and it is now being packed.</p>
      <p>You will receive another email as soon as it is handed over to our courier partner.</p>
      
      ${getButtonHtml(trackingLink)}
    `);

    await queueEmail({
      to: order.email,
      subject: `Order #${order.orderNumber} is Processing`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'processing',
    });
  } catch (error) {
    console.error("Failed to queue processing email:", error);
    throw error;
  }
};

// --- 3. Customer: Order Shipped ---
export const sendShippingUpdate = async (order: any) => {
  try {
    const trackingLink = getTrackingLink(order);

    const html = wrapHtml(`Your Order Has Shipped!`, `
      <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been handed over to Domex.</p>
      
      <div style="background-color: #f0f7ff; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px solid #dcebfb;">
        <p style="margin: 0; color: #555555; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Tracking Number</p>
        <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #1a73e8;">${order.trackingNumber}</p>
      </div>
      <p>You can track your package directly on the Domex website using the tracking number above.</p>

      ${getButtonHtml(trackingLink)}
    `);

    await queueEmail({
      to: order.email,
      subject: `Order #${order.orderNumber} Shipped!`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'shipped',
    });
  } catch (error) {
    console.error("Failed to queue shipping email:", error);
    throw error;
  }
};

// --- 4. Customer: Order Delivered ---
export const sendOrderDelivered = async (order: any) => {
  try {
    const trackingLink = getTrackingLink(order);

    const html = wrapHtml(`Order Delivered`, `
      <p>Your order <strong>#${order.orderNumber}</strong> has been marked as delivered.</p>
      <p>We hope you enjoy your purchase! Thank you for choosing Upul Tailors.</p>
      
      ${getButtonHtml(trackingLink, "Leave a Review")}
    `);

    await queueEmail({
      to: order.email,
      subject: `Order Delivered #${order.orderNumber}`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'delivered',
    });
  } catch (error) {
    console.error("Failed to queue delivery email:", error);
    throw error;
  }
};

// --- 5. Customer: Order Returned ---
export const sendOrderReturned = async (order: any) => {
  try {
    const html = wrapHtml(`Order Returned`, `
      <p>Your order <strong>#${order.orderNumber}</strong> has been processed as returned.</p>
      <p>If you requested this return, your refund (if applicable) is being processed.</p>
    `);

    await queueEmail({
      to: order.email,
      subject: `Order Returned #${order.orderNumber}`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'returned',
    });
  } catch (error) {
    console.error("Failed to queue return email:", error);
    throw error;
  }
};

// --- 6. Customer: Order Cancelled ---
export const sendOrderCancelled = async (order: any) => {
  try {
    const html = wrapHtml(`Order Cancelled #${order.orderNumber}`, `
      <p style="color: #d32f2f; font-weight: bold;">Your order has been cancelled.</p>
      <p>If you have already paid or believe this is an error, please contact us immediately.</p>
    `);

    await queueEmail({
      to: order.email,
      subject: `Order Cancelled #${order.orderNumber}`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'cancelled',
    });
  } catch (error) {
    console.error("Failed to queue cancellation email:", error);
    throw error;
  }
};

// --- 6.5. Customer: Order Refunded ---
export const sendOrderRefunded = async (order: any) => {
  try {
    const refundAmount = order.refundAmount || order.totalAmount;
    
    const html = wrapHtml(`Order Refunded`, `
      <p>Your refund for order <strong>#${order.orderNumber}</strong> has been processed successfully.</p>
      
      <div style="background-color: #f0fff4; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #c6f6d5; text-align: center;">
        <p style="margin: 0; color: #2f855a; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Refund Amount</p>
        <p style="margin: 10px 0 0; font-size: 28px; font-weight: bold; color: #22543d;">LKR ${refundAmount.toLocaleString()}</p>
      </div>

      <p>The refund has been credited to your original payment method. Please allow 3-5 business days for the amount to appear in your account.</p>
      <p>If you have any questions about your refund, please contact our support team.</p>
    `);

    await queueEmail({
      to: order.email,
      subject: `Refund Processed for Order #${order.orderNumber}`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'refunded',
    });
  } catch (error) {
    console.error("Failed to queue refund email:", error);
    throw error;
  }
};

// --- 7. Shop Owner: New Order Alert ---
export const sendShopNewOrderNotification = async (order: any) => {
  try {
    const html = wrapHtml(`New Order Received #${order.orderNumber}`, `
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eeeeee;">
        <p style="margin-top: 0;"><strong>Customer:</strong> ${order.shippingAddress.firstname} ${order.shippingAddress.lastname}</p>
        <p><strong>Amount:</strong> LKR ${order.totalAmount.toLocaleString()}</p>
        <p style="margin-bottom: 0;"><strong>Phone:</strong> <a href="tel:${order.shippingAddress.phoneNumber}" style="color: #1a73e8; text-decoration: none;">${order.shippingAddress.phoneNumber}</a></p>
      </div>
      
      ${getButtonHtml(`${ADMIN_URL}/admin/orders/${order.id}`, "Open Admin Panel")}
    `);

    await queueEmail({
      to: SHOP_EMAIL!,
      subject: `🔔 New Order #${order.orderNumber} - LKR ${order.totalAmount}`,
      html,
      orderNumber: order.orderNumber,
      emailType: 'admin-alert',
    });
  } catch (error) {
    console.error("Failed to queue shop alert:", error);
    throw error;
  }
};


// Add this to email.service.ts
export const sendContactFormAlert = async (data: { name?: string, phone?: string, email: string, comment: string }) => {
  try {
    const html = wrapHtml(`New Contact Form Submission`, `
      <p>You have received a new message from the contact form on upuls.lk:</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #eeeeee;">
        <p style="margin-top: 0;"><strong>Name:</strong> ${data.name || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #1a73e8; text-decoration: none;">${data.email}</a></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="margin-bottom: 5px;"><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; margin-top: 0; color: #333333; font-style: italic;">${data.comment}</p>
      </div>
      
      <p><em>Reply directly to this email to respond to the customer.</em></p>
    `);

    await queueEmail({
      to: process.env.ADMIN_EMAIL || 'upultailors.site@gmail.com', 
      subject: `New Contact Message from ${data.email}`,
      html,
      emailType: 'admin-alert',
    });
  } catch (error) {
    console.error("Failed to queue contact form email:", error);
    throw error;
  }
};

// --- 8. Newsletter: Welcome Email ---
export const sendNewsletterWelcome = async (email: string) => {
  try {
    const html = wrapHtml(`Welcome to UPUL'S International`, `
      <p>Hi there,</p>
      <p>Thank you for subscribing to our newsletter! You're now on the VIP list for UPUL'S International.</p>
      <p>You'll be the first to know about our newest arrivals, exclusive offers, and the latest trends in casual wear.</p>
      
      ${getButtonHtml(`${FRONTEND_URL}/shop`, "Shop New Arrivals")}
      
      <p style="font-size: 11px; color: #999999; margin-top: 40px; text-align: center;">
        If you wish to unsubscribe, you can <a href="${FRONTEND_URL}/unsubscribe?email=${email}" style="color: #999999; text-decoration: underline;">click here</a>.
      </p>
    `);

    await queueEmail({
      to: email,
      subject: `Welcome to the UPUL'S International VIP List!`,
      html,
      emailType: 'newsletter-welcome',
    });
  } catch (error) {
    console.error("Failed to queue newsletter welcome email:", error);
    throw error;
  }
};

// --- 9. Promotional Campaign Broadcast ---
export const sendPromotionalBroadcast = async (email: string, subject: string, customHtml: string) => {
  try {
    const html = wrapHtml(subject, `
      ${customHtml}
      
      <div style="margin-top: 50px; border-top: 1px solid #eeeeee; padding-top: 20px; text-align: center; font-size: 11px; color: #999999;">
        <p style="margin: 0 0 5px 0;">You are receiving this because you subscribed to UPUL'S International.</p>
        <p style="margin: 0;">If you no longer wish to receive these emails, you can <a href="${FRONTEND_URL}/unsubscribe?email=${email}" style="color: #999999; text-decoration: underline;">unsubscribe here</a>.</p>
      </div>
    `);

    await queueEmail({
      to: email,
      subject: subject,
      html,
      emailType: 'promotional-campaign',
    });
  } catch (error) {
    console.error(`Failed to queue broadcast for ${email}:`, error);
  }
};