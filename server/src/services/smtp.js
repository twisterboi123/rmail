const nodemailer = require('nodemailer');

/**
 * Send an email via SMTP using the user's mail credentials.
 * @param {object} user – user DB row
 * @param {{ to: string, cc?: string, subject: string, text?: string, html?: string }} mail
 */
async function sendEmail(user, mail) {
  const transporter = nodemailer.createTransport({
    host: user.smtp_host || process.env.DEFAULT_SMTP_HOST,
    port: user.smtp_port || parseInt(process.env.DEFAULT_SMTP_PORT, 10) || 465,
    secure: true, // TLS
    auth: {
      user: user.mail_username || user.email,
      pass: user.mail_password,
    },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: `"${user.display_name}" <${user.mail_username || user.email}>`,
    to: mail.to,
    cc: mail.cc || undefined,
    subject: mail.subject,
    text: mail.text || undefined,
    html: mail.html || undefined,
  });

  return { messageId: info.messageId, accepted: info.accepted };
}

module.exports = { sendEmail };
