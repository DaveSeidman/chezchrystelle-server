import { Resend } from 'resend';

import { env } from '../config/env';

const resend = env.emailEnabled ? new Resend(env.RESEND_API_KEY) : null;

type EmailLineItem = {
  productId: unknown;
  quantity: number;
  lineTotal: number;
};

type EmailOrder = {
  _id?: unknown;
  status?: string;
  fulfillmentDate: string;
  notes: string;
  lineItems: EmailLineItem[];
  totals: {
    total: number;
  };
};

type EmailUser = {
  email: string;
  displayName: string;
};

function renderOrderLines(order: EmailOrder, productNames: Record<string, string>) {
  const items = order.lineItems
    .map((item) => {
      const productName = productNames[String(item.productId)] ?? 'Product';
      return `<li>${productName} x ${item.quantity} - $${item.lineTotal.toFixed(2)}</li>`;
    })
    .join('');

  return `
    <p>Fulfillment date: <strong>${order.fulfillmentDate}</strong></p>
    <ul>${items}</ul>
    <p>Total: <strong>$${order.totals.total.toFixed(2)}</strong></p>
    <p>Notes: ${order.notes || 'None'}</p>
  `;
}

export async function sendContactEmail(input: { name: string; email: string; message: string; newsletter: boolean }, config: { contactEmail: string }) {
  if (!resend) {
    console.warn('Email disabled: skipping contact email');
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [config.contactEmail],
    replyTo: input.email,
    subject: `Chez Chrystelle contact form: ${input.name}`,
    html: `
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Newsletter:</strong> ${input.newsletter ? 'Yes' : 'No'}</p>
      <p><strong>Message:</strong></p>
      <p>${input.message}</p>
    `
  });
}

export async function sendOrderConfirmationEmail(input: {
  order: EmailOrder;
  user: EmailUser;
  config: { orderThanksMessage: string };
  productNames: Record<string, string>;
}) {
  if (!resend) {
    console.warn('Email disabled: skipping order confirmation email');
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [input.user.email],
    subject: 'Chez Chrystelle order received',
    html: `
      <p>Hi ${input.user.displayName},</p>
      <p>${input.config.orderThanksMessage}</p>
      ${renderOrderLines(input.order, input.productNames)}
    `
  });
}

export async function sendAdminOrderNotificationEmail(input: {
  order: EmailOrder;
  user: EmailUser;
  store: { name: string };
  config: { orderNotificationEmails: string[] };
  productNames: Record<string, string>;
}) {
  if (!resend) {
    console.warn('Email disabled: skipping admin order notification email');
    return;
  }

  if (!input.config.orderNotificationEmails.length) {
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.config.orderNotificationEmails,
    subject: `New Chez Chrystelle order from ${input.user.displayName}`,
    html: `
      <p><strong>Customer:</strong> ${input.user.displayName} (${input.user.email})</p>
      <p><strong>Store:</strong> ${input.store.name}</p>
      <p><strong>Order ID:</strong> ${input.order._id}</p>
      ${renderOrderLines(input.order, input.productNames)}
    `
  });
}

export async function sendOrderStatusEmail(input: {
  order: EmailOrder & { status: string };
  user: EmailUser;
  productNames: Record<string, string>;
}) {
  if (!resend) {
    console.warn('Email disabled: skipping order status email');
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [input.user.email],
    subject: `Chez Chrystelle order update: ${input.order.status}`,
    html: `
      <p>Hi ${input.user.displayName},</p>
      <p>Your order status is now <strong>${input.order.status}</strong>.</p>
      ${renderOrderLines(input.order, input.productNames)}
    `
  });
}
