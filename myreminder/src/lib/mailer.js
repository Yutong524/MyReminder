"use server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendSecurityAlertEmail({ to, subject, html, text }) {
    if (!to) return;
    const from = process.env.FROM_EMAIL;
    await transporter.sendMail({
        from,
        to,
        subject,
        text: text || html?.replace(/<[^>]+>/g, " "),
        html,
    });
}
