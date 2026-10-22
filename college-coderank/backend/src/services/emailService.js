import nodemailer from "nodemailer";

/**
 * Creates and configures the email transporter based on environment variables.
 * Falls back to ethereal/console simulation in development if SMTP is not provided.
 */
let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    return cachedTransporter;
  }

  // Fallback simulator for development/testing without live SMTP credentials
  cachedTransporter = {
    sendMail: async (options) => {
      console.log("\n============================================================");
      console.log("📨 [SIMULATED TRANSACTIONAL EMAIL via Nodemailer fallback]");
      console.log(`To:      ${options.to}`);
      console.log(`From:    ${options.from || process.env.EMAIL_FROM || "CodeRank Security <security@rungta.ac.in>"}`);
      console.log(`Subject: ${options.subject}`);
      console.log("------------------------------------------------------------");
      console.log(options.text || "(HTML Email - Preview in browser)");
      console.log("============================================================\n");
      return { messageId: `simulated-${Date.now()}` };
    }
  };

  return cachedTransporter;
}

/**
 * HTML Email Template: Password Reset Link
 */
export function buildPasswordResetEmailHtml({ studentName, resetLink, expiresInMinutes = 15, clientIp }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Portal Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" max-width="580" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 28px 32px; text-align: left;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.18); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 8px;">
                RUNGTA INTERNATIONAL SKILLS UNIVERSITY
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                College CodeRank Security
              </h1>
              <p style="margin: 4px 0 0; color: #fee2e2; font-size: 13px;">
                Automated Student Password Recovery
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${studentName || "Student"}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset the password associated with your student coding portal account. Click the button below to choose a new password:
              </p>

              <!-- Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 28px;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #dc2626;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                      Reset Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert Box -->
              <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9a3412;">
                  <strong>⏳ Expiration Notice:</strong> This one-time link is valid for <strong>${expiresInMinutes} minutes</strong> only. Once used or expired, a new request must be generated.
                </p>
              </div>

              <!-- Raw Link Fallback -->
              <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.5;">
                If the button above does not work, copy and paste this secure link directly into your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 11px; color: #dc2626; word-break: break-all; background-color: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <a href="${resetLink}" style="color: #dc2626; text-decoration: none;">${resetLink}</a>
              </p>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 8px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #0f172a;">
                  Didn't request this change?
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  If you did not initiate this password reset request, you can safely ignore this email. Your current password remains active and secure.
                </p>
                ${clientIp ? `<p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">Requested from IP: <code>${clientIp}</code></p>` : ""}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #475569;">
                Presented by Data Science Club · Rungta University
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This is an automated system notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * HTML Email Template: Password Changed Confirmation Alert
 */
export function buildPasswordChangedConfirmationEmailHtml({ studentName, timestamp, clientIp }) {
  const formattedTime = timestamp || new Date().toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert: Password Changed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" max-width="580" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 28px 32px; text-align: left;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.18); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 8px;">
                SECURITY NOTIFICATION
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                Password Successfully Updated
              </h1>
              <p style="margin: 4px 0 0; color: #dcfce7; font-size: 13px;">
                College CodeRank Student Portal
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${studentName || "Student"}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                This is a confirmation that the password for your student coding portal account was successfully changed on <strong>${formattedTime}</strong>.
              </p>

              <!-- Success Box -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #166534;">
                  ✅ <strong>Security Status:</strong> All existing active login sessions on other devices have been invalidated. You can now use your new password to sign in.
                </p>
              </div>

              <!-- Critical Alert Box -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #991b1b;">
                  ⚠️ Did you NOT make this change?
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #b91c1c;">
                  If you did not authorize this password update, someone else may have gained access to your account. Please immediately initiate a password reset or contact the Campus IT Helpdesk to lock your profile.
                </p>
                ${clientIp ? `<p style="margin: 8px 0 0; font-size: 11px; color: #dc2626;">Device IP: <code>${clientIp}</code></p>` : ""}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #475569;">
                Rungta International Skills University · Data Science Club
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Automated Transactional Alert · Confidential
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends the Password Reset Link email.
 */
export async function sendPasswordResetEmail({ to, studentName, resetLink, expiresInMinutes = 15, clientIp }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || "CodeRank Security <security@rungta.ac.in>";

  const mailOptions = {
    from,
    to,
    subject: "Reset Your College CodeRank Password",
    text: `Hello ${studentName},\n\nYou requested to reset your College CodeRank password. Click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for ${expiresInMinutes} minutes.\nIf you did not request this, please ignore this email.\n`,
    html: buildPasswordResetEmailHtml({ studentName, resetLink, expiresInMinutes, clientIp })
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Sends the Password Changed Confirmation alert email.
 */
export async function sendPasswordChangedConfirmationEmail({ to, studentName, timestamp, clientIp }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || "CodeRank Security <security@rungta.ac.in>";

  const mailOptions = {
    from,
    to,
    subject: "Security Alert: Your College CodeRank Password Was Changed",
    text: `Hello ${studentName},\n\nYour College CodeRank student portal password was successfully updated on ${timestamp}.\nAll other active sessions have been invalidated.\n\nIf you did not make this change, please contact campus IT immediately.\n`,
    html: buildPasswordChangedConfirmationEmailHtml({ studentName, timestamp, clientIp })
  };

  return transporter.sendMail(mailOptions);
}
