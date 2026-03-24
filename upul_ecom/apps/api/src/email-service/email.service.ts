import { queueEmail } from './email-queue';

const SHOP_EMAIL = process.env.SMTP_USER;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3002';

// --- Helpers ---

const wrapHtml = (title: string, content: string) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #000000; padding: 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">UPUL INTERNATIONAL</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #333333; margin-top: 0;">${title}</h2>
      ${content}
    </div>
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888888;">
      <p style="margin: 0;">Thank you for shopping with us.</p>
      <p style="margin: 5px 0 0;">Questions? Reply to this email.</p>
    </div>
  </div>
`;

const getTrackingLink = (order: any) => {
  return order.guestToken 
    ? `${FRONTEND_URL}/track-order?token=${order.guestToken}`
    : `${FRONTEND_URL}/profile/orders/${order.id}`;
};

const getButtonHtml = (link: string, text: string = "View Order") => `
  <div style="text-align: center; margin-top: 30px;">
    <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">${text}</a>
  </div>
`;

// --- 1. Customer: Order Placed (Invoice) ---
export const sendOrderConfirmation = async (order: any) => {
  try {
    const itemsHtml = order.items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0;">
        <span>${item.name} <span style="color: #888; font-size: 12px;">x${item.quantity}</span></span>
        <span style="font-weight: bold;">LKR ${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `).join('');

    const trackingLink = getTrackingLink(order);

    const html = wrapHtml(`Order Confirmed #${order.orderNumber}`, `
      <p>Hi there,</p>
      <p>Thank you for your order! We have received it and will verify it shortly via phone call.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; border-bottom: 2px solid #ddd; padding-bottom: 5px;">INVOICE</h3>
        ${itemsHtml}
        <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
          <span>Total (COD)</span>
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

    const html = wrapHtml(`Processing Started ⚙️`, `
      <p>Good news! We have verified your order <b>#${order.orderNumber}</b> and it is now being packed.</p>
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

    const html = wrapHtml(`Your Order Has Shipped! 🚚`, `
      <p>Great news! Your order <b>#${order.orderNumber}</b> has been handed over to Domex.</p>
      
      <div style="background: #eefbee; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; color: #555; font-size: 12px; text-transform: uppercase; font-weight: bold;">Tracking Number</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #000;">${order.trackingNumber}</p>
      </div>
      <p>You can track your package on the Domex website.</p>

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

    const html = wrapHtml(`Order Delivered ✅`, `
      <p>Your order <b>#${order.orderNumber}</b> has been marked as delivered.</p>
      <p>We hope you enjoy your purchase! Thank you for choosing Upul International.</p>
      
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
    const html = wrapHtml(`Order Returned ↩️`, `
      <p>Your order <b>#${order.orderNumber}</b> has been processed as returned.</p>
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
      <p style="color: #d32f2f;">Your order has been cancelled.</p>
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
    
    const html = wrapHtml(`Order Refunded 💳`, `
      <p>Your refund for order <b>#${order.orderNumber}</b> has been processed successfully.</p>
      
      <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #2e7d32; font-weight: bold;">Refund Amount</p>
        <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #1b5e20;">LKR ${refundAmount.toLocaleString()}</p>
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
      <p style="font-size: 16px;"><b>Customer:</b> ${order.shippingAddress.firstname} ${order.shippingAddress.lastname}</p>
      <p style="font-size: 16px;"><b>Amount:</b> LKR ${order.totalAmount.toLocaleString()}</p>
      <p style="font-size: 16px;"><b>Phone:</b> <a href="tel:${order.shippingAddress.phoneNumber}">${order.shippingAddress.phoneNumber}</a></p>
      
      <div style="margin-top: 20px;">
        <a href="${ADMIN_URL}/admin/orders/${order.id}" style="color: blue; text-decoration: underline;">Open Admin Panel</a>
      </div>
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