import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

/**
 * Detects the active email delivery mechanism:
 * 1. "brevo": Brevo HTTP API (Port 443 - works on Render Free Tier!)
 * 2. "resend": Resend HTTP API (Port 443 - works on Render Free Tier!)
 * 3. "smtp": Direct SMTP (e.g. Gmail - works locally or on paid cloud hosting)
 * 4. "none": Unconfigured
 */
export function getEmailProviderInfo() {
  const rawBrevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "";
  const brevoKey = rawBrevoKey.trim().replace(/^['"]|['"]$/g, "").trim();
  if (brevoKey) {
    return {
      provider: "brevo",
      configured: true,
      protocol: "https",
      sender: getFromAddress()
    };
  }

  const rawResendKey = process.env.RESEND_API_KEY || "";
  const resendKey = rawResendKey.trim().replace(/^['"]|['"]$/g, "").trim();
  if (resendKey) {
    return {
      provider: "resend",
      configured: true,
      protocol: "https",
      sender: process.env.EMAIL_FROM || "onboarding@resend.dev"
    };
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return {
      provider: "smtp",
      configured: true,
      protocol: "smtp",
      host: SMTP_HOST,
      sender: getFromAddress()
    };
  }

  return {
    provider: "none",
    configured: false
  };
}

export function isEmailConfigured() {
  return getEmailProviderInfo().configured;
}

/**
 * Creates and configures the email transporter based on environment variables.
 * Used when direct SMTP is selected.
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
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
    return cachedTransporter;
  }

  const error = new Error(
    "Email delivery is not configured. For free cloud hosting (like Render Free Tier), configure BREVO_API_KEY (from brevo.com) or RESEND_API_KEY (from resend.com). For local development, set SMTP_HOST, SMTP_USER, and SMTP_PASS."
  );
  error.statusCode = 503;
  error.expose = true;
  throw error;
}

function getFromAddress() {
  return process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `College CodeRank <${process.env.SMTP_USER}>`
      : "College CodeRank");
}

/**
 * Unified transactional email dispatcher.
 * Automatically routes through:
 * 1. Brevo HTTP REST API (port 443 HTTPS - works on Render Free Tier)
 * 2. Resend HTTP REST API (port 443 HTTPS - works on Render Free Tier)
 * 3. Direct SMTP via Nodemailer with fail-fast timeouts
 */
export async function dispatchEmail({ to, subject, html, text, replyTo, headers = {} }) {
  const providerInfo = getEmailProviderInfo();

  if (!providerInfo.configured) {
    const error = new Error(
      "Email delivery is not configured. On Render Free Tier, please configure BREVO_API_KEY (from brevo.com) or RESEND_API_KEY (from resend.com). For local development, configure SMTP_HOST, SMTP_USER, and SMTP_PASS."
    );
    error.statusCode = 503;
    error.expose = true;
    throw error;
  }

  // 1. Brevo HTTP REST API (Port 443 HTTPS - Works reliably on Render Free Tier)
  if (providerInfo.provider === "brevo") {
    const rawBrevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || "";
    const apiKey = rawBrevoKey.trim().replace(/^['"]|['"]$/g, "").trim();
    const fromAddress = getFromAddress();

    let senderName = "College CodeRank";
    let senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "noreply@rungta.org";

    const match = fromAddress.match(/^(?:(.*?)<)?([^<>]+)>?$/);
    if (match) {
      if (match[1]?.trim()) senderName = match[1].trim();
      if (!process.env.BREVO_SENDER_EMAIL && match[2]?.trim()) senderEmail = match[2].trim();
    }

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    };
    if (replyTo) {
      payload.replyTo = { email: replyTo.replace(/.*<([^>]+)>.*/, "$1").trim() };
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("[EmailService/Brevo] API Error:", body);

        let errorMsg = body.message || `Brevo API returned status ${response.status}`;
        if (errorMsg.toLowerCase().includes("key not found") || response.status === 401) {
          errorMsg =
            "Brevo returned 'Key not found' (401 Unauthorized). Please check your Brevo account: under 'SMTP & API', click on the 'API Keys' tab (DO NOT copy from the SMTP tab). Click 'Generate a new API key' (starts with 'xkeysib-') and paste it into Render Dashboard Environment Variables as BREVO_API_KEY without quotes or extra spaces.";
        } else if (errorMsg.toLowerCase().includes("sender") || errorMsg.toLowerCase().includes("unauthorized")) {
          errorMsg = `${errorMsg}. In Brevo, the sender email (${senderEmail}) must be a verified sender. Add BREVO_SENDER_EMAIL in Render with your Brevo login email or verify it in Brevo -> Senders & IP -> Senders.`;
        }

        const err = new Error(errorMsg);
        err.statusCode = 502;
        throw err;
      }

      console.log(`[EmailService/Brevo] Dispatched email to ${to} (Message ID: ${body.messageId || "ok"})`);
      return { messageId: body.messageId || "ok", provider: "brevo" };
    } catch (err) {
      console.error("[EmailService/Brevo] Request failed:", err.message);
      const deliveryErr = new Error(`Brevo HTTP delivery failed: ${err.message}`);
      deliveryErr.statusCode = 502;
      deliveryErr.expose = true;
      throw deliveryErr;
    }
  }

  // 2. Resend HTTP REST API (Port 443 HTTPS - Works reliably on Render Free Tier)
  if (providerInfo.provider === "resend") {
    const rawResendKey = process.env.RESEND_API_KEY || "";
    const apiKey = rawResendKey.trim().replace(/^['"]|['"]$/g, "").trim();
    const from = process.env.EMAIL_FROM || "College CodeRank <onboarding@resend.dev>";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
          reply_to: replyTo
        })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("[EmailService/Resend] API Error:", body);
        const err = new Error(body.message || `Resend API returned status ${response.status}`);
        err.statusCode = 502;
        throw err;
      }

      console.log(`[EmailService/Resend] Dispatched email to ${to} (ID: ${body.id || "ok"})`);
      return { messageId: body.id || "ok", provider: "resend" };
    } catch (err) {
      console.error("[EmailService/Resend] Request failed:", err.message);
      const deliveryErr = new Error(`Resend HTTP delivery failed: ${err.message}`);
      deliveryErr.statusCode = 502;
      deliveryErr.expose = true;
      throw deliveryErr;
    }
  }

  // 3. Direct SMTP via Nodemailer (Port 587 / 465)
  const transporter = getTransporter();
  const from = getFromAddress();

  const mailOptions = {
    from,
    to,
    replyTo: replyTo || process.env.SMTP_USER || from,
    subject,
    text,
    html,
    headers: {
      "X-Mailer": "College CodeRank Notification System",
      "X-Priority": "1 (Highest)",
      "Importance": "High",
      ...headers
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService/SMTP] Email successfully dispatched to ${to} (Message ID: ${info.messageId || "ok"})`);
    return info;
  } catch (err) {
    console.error(`[EmailService/SMTP] Delivery failed to ${to}:`, err.message);

    const isTimeoutOrRefused =
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNREFUSED" ||
      err.code === "EHOSTUNREACH" ||
      err.code === "ESOCKETTIMEDOUT" ||
      err.message?.includes("timeout");

    let message = `SMTP delivery failed: ${err.message}`;
    if (isTimeoutOrRefused) {
      message =
        "SMTP connection timed out. Free cloud hosting (such as Render Free Tier) blocks outbound SMTP ports (25, 465, 587) to prevent spam. To send emails from Render Free Tier, please add a free BREVO_API_KEY (from brevo.com) or RESEND_API_KEY (from resend.com) to your Render Dashboard Environment Variables.";
    }

    const deliveryError = new Error(message);
    deliveryError.statusCode = 502;
    deliveryError.expose = true;
    throw deliveryError;
  }
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
  return dispatchEmail({
    to,
    subject: "Reset Your College CodeRank Password",
    text: `Hello ${studentName},\n\nYou requested to reset your College CodeRank password. Click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for ${expiresInMinutes} minutes.\nIf you did not request this, please ignore this email.\n`,
    html: buildPasswordResetEmailHtml({ studentName, resetLink, expiresInMinutes, clientIp })
  });
}

/**
 * Sends the Password Changed Confirmation alert email.
 */
export async function sendPasswordChangedConfirmationEmail({ to, studentName, timestamp, clientIp }) {
  return dispatchEmail({
    to,
    subject: "Security Alert: Your College CodeRank Password Was Changed",
    text: `Hello ${studentName},\n\nYour College CodeRank student portal password was successfully updated on ${timestamp}.\nAll other active sessions have been invalidated.\n\nIf you did not make this change, please contact campus IT immediately.\n`,
    html: buildPasswordChangedConfirmationEmailHtml({ studentName, timestamp, clientIp })
  });
}

/**
 * Maps role identifier to a human-readable title.
 */
function getRoleLabel(role) {
  switch (role) {
    case "tpo":
      return "Training & Placement Officer (TPO)";
    case "director":
      return "Director of School / Faculty";
    case "hod":
      return "Head of Department (HOD)";
    case "teacher":
      return "Faculty Member / Teacher";
    default:
      return "Institutional Staff";
  }
}

/**
 * HTML Email Template: Institutional Account Setup Invitation
 */
export function buildInvitationEmailHtml({
  recipientName,
  recipientEmail,
  role,
  setupLink,
  expiresInHours = 24,
  invitedByName,
  departmentName,
  directorateName
}) {
  const roleLabel = getRoleLabel(role);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Setup Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); padding: 32px 36px; text-align: left;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.18); border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 10px;">
                RUNGTA INTERNATIONAL SKILLS UNIVERSITY
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">
                Official Account Setup Invitation
              </h1>
              <p style="margin: 6px 0 0; color: #e0e7ff; font-size: 13px;">
                College CodeRank Institutional Management System
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #1e293b;">
                Dear <strong>${recipientName || "Colleague"}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                You have been formally invited to join the <strong>College CodeRank Institutional Portal</strong> as an authorized administrative staff member.
              </p>

              <!-- Assignment Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 28px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Assignment Details
                    </div>
                    <table width="100%" cellspacing="0" cellpadding="4" border="0">
                      <tr>
                        <td width="35%" style="font-size: 13px; color: #64748b; font-weight: 500;">Assigned Role:</td>
                        <td style="font-size: 13px; color: #1e293b; font-weight: 700;">
                          <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px;">
                            ${roleLabel}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b; font-weight: 500;">Official Email:</td>
                        <td style="font-size: 13px; color: #1e293b; font-weight: 600;">${recipientEmail}</td>
                      </tr>
                      ${directorateName ? `
                      <tr>
                        <td style="font-size: 13px; color: #64748b; font-weight: 500;">School / Faculty:</td>
                        <td style="font-size: 13px; color: #1e293b; font-weight: 600;">${directorateName}</td>
                      </tr>` : ""}
                      ${departmentName ? `
                      <tr>
                        <td style="font-size: 13px; color: #64748b; font-weight: 500;">Department:</td>
                        <td style="font-size: 13px; color: #1e293b; font-weight: 600;">${departmentName}</td>
                      </tr>` : ""}
                      ${invitedByName ? `
                      <tr>
                        <td style="font-size: 13px; color: #64748b; font-weight: 500;">Invited By:</td>
                        <td style="font-size: 13px; color: #1e293b; font-weight: 600;">${invitedByName}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                    <a href="${setupLink}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.2px;">
                      Set Up Your Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert Box -->
              <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #854d0e;">
                  <strong>⏳ Single-Use Invitation:</strong> This link is single-use and will expire in <strong>${expiresInHours} hours</strong>. You will be prompted to set your own password upon opening the link.
                </p>
              </div>

              <!-- Raw Link Fallback -->
              <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.5;">
                If the button above does not work, copy and paste this secure link directly into your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 11px; color: #4f46e5; word-break: break-all; background-color: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <a href="${setupLink}" style="color: #4f46e5; text-decoration: none;">${setupLink}</a>
              </p>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 8px;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #0f172a;">
                  Security Guidelines
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  Never share this link with anyone. Our institutional administrators will never ask for your password. If you were not expecting this invitation, please contact your university administrator.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 22px 36px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #475569;">
                Rungta International Skills University · Administrative Operations
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Automated Institutional Notification · Confidential
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
 * Sends the Institutional Account Setup Invitation email.
 */
export async function sendInvitationEmail({
  to,
  recipientName,
  role,
  setupLink,
  expiresInHours = 24,
  invitedByName,
  departmentName,
  directorateName
}) {
  const roleLabel = getRoleLabel(role);

  return dispatchEmail({
    to,
    subject: `Official Invitation: Set Up Your ${roleLabel} Account`,
    text: `Hello ${recipientName},\n\nYou have been invited to join the College CodeRank system as ${roleLabel}.\n\nClick the link below to set up your account and choose your password:\n${setupLink}\n\nThis single-use link is valid for ${expiresInHours} hours.\n\nIf you did not expect this invitation, please contact your campus administrator.\n`,
    html: buildInvitationEmailHtml({
      recipientName,
      recipientEmail: to,
      role,
      setupLink,
      expiresInHours,
      invitedByName,
      departmentName,
      directorateName
    })
  });
}
