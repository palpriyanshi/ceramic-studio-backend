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

// Default export for email.utils.js compatibility
export default { sendMail: (...args) => getTransporter().sendMail(...args) };
