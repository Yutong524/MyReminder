"use server";
import nodemailer from "nodemailer";

let _tx = null;
async function getTransporter() {
    if (_tx) return _tx;
    const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    });
    try { await t.verify(); }
    catch { }
    _tx = t;
    return _tx;
}

function toPlain(html, fallback = "") {
    if (!html) return fallback || "";
    return html.replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s/ + g, " ")
        .trim();
}

export async function sendTransactional({ to, subject, html, text, headers }) {
    if (!to) return { ok: false, reason: "NO_RECIPIENT" };
    const from = process.env.FROM_EMAIL || "no-reply@example.com";
    try {
        const tx = await getTransporter();
        const info = await tx.sendMail({
            from,
            to,
            subject,
            html,
            text: text || toPlain(html),
            headers,
        });
        return { ok: true, messageId: info?.messageId || null };
    } catch (e) {
        console.error("sendTransactional error:", e?.message);
        return { ok: false, reason: "SEND_ERROR" };
    }
}

export async function sendSecurityAlertEmail({ to, subject, html, text }) {
    return sendTransactional({
        to,
        subject,
        html,
        text
    });
}

export async function sendInviteEmail({
    to,
    folderName,
    inviterName,
    acceptUrl,
    expiresAt,
}) {
    const subject = `You've been invited to a shared folder: ${folderName}`;
    const html = `
    <div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Folder invitation</h2>
      <p><b>${inviterName || "A teammate"}</b> invited you to access
         the folder <b>${folderName}</b> on <b>MyReminder</b>.</p>
      ${expiresAt ? `<p>This invite expires on <b>${new Date(expiresAt).toLocaleString()}</b>.</p>` : ""}
      <p>
        <a href="${acceptUrl}" 
           style="display:inline-block;padding:10px 14px;border-radius:10px;
                  background:#0D63E5;color:#fff;text-decoration:none;font-weight:700">
          Accept invitation
        </a>
      </p>
      <p style="font-size:13px;color:#63718A">If you didn't expect this, you can ignore this email.</p>
    </div>`;

    return sendTransactional({ to, subject, html });
}