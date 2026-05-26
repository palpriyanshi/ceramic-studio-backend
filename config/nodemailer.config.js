import nodemailer from "nodemailer";

// Lazy getter — transporter is created on first use, AFTER dotenv has loaded
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // Fail fast with a clear message if env vars are missing
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      `Nodemailer misconfiguration — missing env vars:\n` +
        `  SMTP_HOST : ${SMTP_HOST || "❌ not set"}\n` +
        `  SMTP_PORT : ${SMTP_PORT || "❌ not set (will default to 587)"}\n` +
        `  SMTP_USER : ${SMTP_USER || "❌ not set"}\n` +
        `  SMTP_PASS : ${SMTP_PASS ? "✅ set" : "❌ not set"}`
    );
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true only for port 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Sends a welcome email to a newly registered user.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient's display name
 */
export async function sendWelcomeEmail(to, name) {
  const transporter = getTransporter();

  const appName = process.env.FROM_NAME || "MERN App";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">Welcome, ${name}! 🎉</h2>
      <p style="color: #555; font-size: 15px;">
        Thanks for registering with <strong>${appName}</strong>.
        Your account has been created successfully.
      </p>
      <p style="color: #555; font-size: 15px;">
        You can now log in and start exploring.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${appName}" <${process.env.SMTP_USER}>`,
      to,
      subject: `Welcome to ${appName}!`,
      html,
    });
    console.log(`✅ Welcome email sent to ${to} — MessageId: ${info.messageId}`);
  } catch (err) {
    // Enrich the error with context before re-throwing
    const enriched = new Error(
      `sendWelcomeEmail failed for "${to}": ${err.message}\n` +
        `  SMTP_HOST : ${process.env.SMTP_HOST}\n` +
        `  SMTP_PORT : ${process.env.SMTP_PORT}\n` +
        `  SMTP_USER : ${process.env.SMTP_USER}\n` +
        `  Error code: ${err.code || "N/A"}\n` +
        `  Response  : ${err.response || "N/A"}`
    );
    enriched.stack = err.stack;
    throw enriched;
  }
}

/**
 * Sends a branded order confirmation email to the customer.
 * @param {string} to   - Recipient email address (from shippingAddress.email)
 * @param {object} order - Saved Order document (plain object or Mongoose doc)
 */
export async function sendOrderConfirmationEmail(to, order) {
  const transporter = getTransporter();
  const appName = process.env.FROM_NAME || "Ceramic Studio";

  // ── Format helpers ──────────────────────────────────────────────────────────
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const shortId = String(order._id).slice(-8).toUpperCase();

  // ── Build item rows ─────────────────────────────────────────────────────────
  const itemRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px 8px; border-bottom: 1px solid #f0ebe3; vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${
              item.thumbnail
                ? `<img src="${item.thumbnail}" alt="${item.title}"
                    style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #e8dfd3;" />`
                : `<div style="width:56px;height:56px;border-radius:8px;background:#f0ebe3;"></div>`
            }
            <div>
              <div style="font-weight:600;color:#3d2b1f;font-size:14px;">${item.title}</div>
              <div style="color:#8b7355;font-size:12px;margin-top:2px;">Qty: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding: 14px 8px; border-bottom: 1px solid #f0ebe3; text-align: right; color: #3d2b1f; font-weight: 500; font-size: 14px; vertical-align: middle;">
          ${fmt(item.subtotal)}
        </td>
      </tr>`
    )
    .join("");

  // ── Totals section ──────────────────────────────────────────────────────────
  const totalsRows = `
    <tr>
      <td style="padding:8px 8px 4px;color:#8b7355;font-size:13px;">Items Total</td>
      <td style="padding:8px 8px 4px;text-align:right;color:#3d2b1f;font-size:13px;">${fmt(order.itemsTotal)}</td>
    </tr>
    ${
      order.shippingCharge > 0
        ? `<tr>
            <td style="padding:4px 8px;color:#8b7355;font-size:13px;">Shipping</td>
            <td style="padding:4px 8px;text-align:right;color:#3d2b1f;font-size:13px;">${fmt(order.shippingCharge)}</td>
          </tr>`
        : `<tr>
            <td style="padding:4px 8px;color:#8b7355;font-size:13px;">Shipping</td>
            <td style="padding:4px 8px;text-align:right;color:#5a8a5a;font-size:13px;">FREE</td>
          </tr>`
    }
    ${
      order.discount > 0
        ? `<tr>
            <td style="padding:4px 8px;color:#8b7355;font-size:13px;">Discount</td>
            <td style="padding:4px 8px;text-align:right;color:#5a8a5a;font-size:13px;">− ${fmt(order.discount)}</td>
          </tr>`
        : ""
    }
    <tr>
      <td style="padding:12px 8px 8px;font-weight:700;color:#3d2b1f;font-size:15px;border-top:2px solid #d4b896;">Grand Total</td>
      <td style="padding:12px 8px 8px;text-align:right;font-weight:700;color:#b5651d;font-size:15px;border-top:2px solid #d4b896;">${fmt(order.grandTotal)}</td>
    </tr>`;

  // ── Payment method label ────────────────────────────────────────────────────
  const paymentLabel = {
    cod: "Cash on Delivery",
    razorpay: "Razorpay (Online)",
    card: "Credit / Debit Card",
  }[order.payment?.method] || order.payment?.method || "—";

  // ── Full HTML email ─────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation — ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,43,31,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3d2b1f 0%,#6b4226 50%,#b5651d 100%);padding:40px 32px;text-align:center;">
              <div style="font-size:11px;letter-spacing:4px;color:#d4b896;text-transform:uppercase;margin-bottom:8px;">Handcrafted with Care</div>
              <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:1px;">${appName}</div>
              <div style="margin-top:20px;display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(212,184,150,0.4);border-radius:8px;padding:8px 20px;">
                <span style="font-size:11px;color:#d4b896;letter-spacing:2px;text-transform:uppercase;">Order Confirmed ✓</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 0;">
              <p style="margin:0;font-size:16px;color:#3d2b1f;line-height:1.6;">
                Hi <strong>${order.shippingAddress?.fullName || "Valued Customer"}</strong>,<br/>
                Thank you for your order! We've received it and will start preparing your ceramics shortly.
              </p>
            </td>
          </tr>

          <!-- Order meta -->
          <tr>
            <td style="padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border-radius:10px;border:1px solid #e8dfd3;">
                <tr>
                  <td style="padding:16px 20px;border-right:1px solid #e8dfd3;">
                    <div style="font-size:10px;letter-spacing:2px;color:#8b7355;text-transform:uppercase;">Order ID</div>
                    <div style="font-size:15px;font-weight:700;color:#3d2b1f;margin-top:4px;">#${shortId}</div>
                  </td>
                  <td style="padding:16px 20px;border-right:1px solid #e8dfd3;">
                    <div style="font-size:10px;letter-spacing:2px;color:#8b7355;text-transform:uppercase;">Date</div>
                    <div style="font-size:15px;font-weight:700;color:#3d2b1f;margin-top:4px;">${orderDate}</div>
                  </td>
                  <td style="padding:16px 20px;">
                    <div style="font-size:10px;letter-spacing:2px;color:#8b7355;text-transform:uppercase;">Payment</div>
                    <div style="font-size:14px;font-weight:600;color:#3d2b1f;margin-top:4px;">${paymentLabel}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:0 32px;">
              <div style="font-size:11px;letter-spacing:2px;color:#8b7355;text-transform:uppercase;margin-bottom:12px;">Your Items</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:8px 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${totalsRows}
              </table>
            </td>
          </tr>

          <!-- Shipping address -->
          <tr>
            <td style="padding:0 32px 32px;">
              <div style="background:#faf7f2;border:1px solid #e8dfd3;border-radius:10px;padding:20px;">
                <div style="font-size:11px;letter-spacing:2px;color:#8b7355;text-transform:uppercase;margin-bottom:10px;">📦 Shipping To</div>
                <div style="color:#3d2b1f;font-size:14px;line-height:1.7;">
                  <strong>${order.shippingAddress?.fullName || ""}</strong><br/>
                  ${order.shippingAddress?.address || ""}<br/>
                  <span style="color:#8b7355;">${order.shippingAddress?.email || ""}</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#3d2b1f;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#d4b896;font-size:13px;">
                Questions? Reply to this email or visit our store.
              </p>
              <p style="margin:0;color:#8b7355;font-size:11px;letter-spacing:1px;">
                © ${new Date().getFullYear()} ${appName} · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: `"${appName}" <${process.env.SMTP_USER}>`,
      to,
      subject: `Your ${appName} Order is Confirmed! (#${shortId})`,
      html,
    });
    console.log(`✅ Order confirmation email sent to ${to} — MessageId: ${info.messageId}`);
  } catch (err) {
    // Log but don't re-throw — email failure must NOT block the order response
    console.error(
      `⚠️  sendOrderConfirmationEmail failed for "${to}": ${err.message}\n` +
      `   SMTP_HOST : ${process.env.SMTP_HOST}\n` +
      `   Error code: ${err.code || "N/A"}`
    );
  }
}

// Default export for email.utils.js compatibility
export default { sendMail: (...args) => getTransporter().sendMail(...args) };
