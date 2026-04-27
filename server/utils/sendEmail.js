const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const missingConfig =
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_USER.includes("your_email") ||
    process.env.SMTP_PASS.includes("your_email_password");

  if (missingConfig) {
    console.log("Email skipped. Configure SMTP settings to enable real emails.");
    return { skipped: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    return await transporter.sendMail({
      from: `"FoodFlow" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.log(`Email skipped due to SMTP error: ${error.message}`);
    return { skipped: true, reason: error.message };
  }
};

module.exports = sendEmail;
