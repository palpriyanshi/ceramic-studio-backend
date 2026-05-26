import dotenv from "dotenv";
dotenv.config({ path: "./env/.env" });

import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_NAME } = process.env;

console.log("SMTP_HOST :", SMTP_HOST);
console.log("SMTP_USER :", SMTP_USER);
console.log("SMTP_PASS :", SMTP_PASS ? `✅ set (${SMTP_PASS.length} chars)` : "❌ not set");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// 1. Verify connection
try {
  await transporter.verify();
  console.log("✅ SMTP connection verified");
} catch (err) {
  console.error("❌ SMTP verify failed:", err.message, "| code:", err.code, "| response:", err.response);
  process.exit(1);
}

// 2. Send a real test email
try {
  const info = await transporter.sendMail({
    from: `"${FROM_NAME || "Ceramic Studio"}" <${SMTP_USER}>`,
    to: SMTP_USER,
    subject: "🧪 Ceramic Studio — Email Test",
    html: `<h2 style="color:#5a3e2b">Email delivery test ✅</h2>
           <p>Sent at ${new Date().toISOString()}</p>
           <p>If you see this, the nodemailer pipeline is working correctly.</p>`,
  });
  console.log("✅ Test email sent! MessageId:", info.messageId);
  console.log("   Accepted :", info.accepted);
  console.log("   Rejected :", info.rejected);
} catch (err) {
  console.error("❌ sendMail failed:", err.message);
  console.error("   code     :", err.code);
  console.error("   response :", err.response);
  process.exit(1);
}
