/**
 * @file email.utils.js
 * @description Generic email sending utility.
 *
 * Wraps the nodemailer transporter with a simple interface.
 * For specific email types (e.g. welcome email), use the dedicated
 * functions in config/nodemailer.config.js instead.
 *
 * @requires SMTP_USER  - Sender email address
 * @requires FROM_NAME  - Sender display name
 */

import transporter from "../config/nodemailer.config.js";

/**
 * Sends an HTML email.
 *
 * @param {string} to          - Recipient email address
 * @param {string} subject     - Email subject line
 * @param {string} htmlContent - HTML body of the email
 * @returns {Promise<boolean>} true if sent successfully, false on error
 *
 * @example
 * const sent = await sendEmail(
 *   'user@example.com',
 *   'Your order has shipped',
 *   '<p>Your order #123 is on its way!</p>'
 * );
 */
async function sendEmail(to, subject, htmlContent) {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || "MERN App"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export default sendEmail;
