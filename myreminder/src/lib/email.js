import nodemailer from 'nodemailer';

let cached;

export function getTransporter() {
    if (cached) return cached;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

    if (!host || !user || !pass) {
        throw new Error('SMTP configuration missing. Please set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.');
    }

    cached = nodemailer.createTransport({
        host, port, secure,
        auth: { user, pass },
    });

    return cached;
}

export async function sendEmail({ to, subject, text, html }) {
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const transporter = getTransporter();
    const info = await transporter.sendMail({ from, to, subject, text, html: html || `<pre>${text}</pre>` });
    return info;
}
