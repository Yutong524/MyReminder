import { prisma } from "@/lib/prisma";
import { sendSecurityAlertEmail } from "@/lib/mailer";

export function ipFromHeaders(headers) {
    const h = (k) => headers.get(k) || headers.get(k.toLowerCase());
    const ff = h("x-forwarded-for");
    const ip = ff ? ff.split(",")[0].trim() : h("x-real-ip") || h("cf-connecting-ip") || null;
    return ip || null;
}

export function cityFromHeaders(headers) {
    const h = (k) => headers.get(k) || headers.get(k.toLowerCase());
    return h("x-vercel-ip-city") || h("cf-ipcity") || h("fly-client-city") || null;
}


export async function logSecurityEvent({ userId, type, req, meta }) {
    try {
        const ip = req ? ipFromHeaders(req.headers) : null;
        const ua = req ? req.headers.get("user-agent") || null : null;
        const city = req ? cityFromHeaders(req.headers) : null;
        await prisma.securityEvent.create({
            data: {
                userId,
                type,
                ip,
                userAgent: ua,
                meta: meta ? { ...meta, city } : (city ? { city } : null)
            }
        });
    } catch (e) {
        console.error("securityEvent error:", e?.message);
    }
}

export async function touchCurrentSession({ req, userId, sessionToken }) {
    if (!sessionToken || !userId) return;
    try {
        const ip = ipFromHeaders(req.headers);
        const ua = req.headers.get("user-agent") || null;
        const city = cityFromHeaders(req.headers);

        const s = await prisma.session.findUnique({ where: { sessionToken } });
        const firstWrite = !s?.ip && !s?.userAgent;
        await prisma.session.update({
            where: { sessionToken },
            data: { ip, userAgent: ua, city, lastSeenAt: new Date() }
        });
        if (firstWrite) {
            await logSecurityEvent({ userId, type: "SIGN_IN", req });
        }

        await maybeAlertNewDevice({ userId, ip, userAgent: ua, city });
    } catch (e) {
        console.error("touchSession error:", e?.message);
    }
}

export async function maybeAlertNewDevice({ userId, ip, userAgent, city }) {
    try {
        if (!userId) return;
        const ua = (userAgent || "").slice(0, 300);
        const fingerprint = `${ip || "?"}|${city || "?"}|${ua || "?"}`;
        const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

        const existed = await prisma.securityEvent.findFirst({
            where: {
                userId,
                type: "SECURITY_LOGIN_ALERT",
                createdAt: { gte: since },
                meta: { path: ["fingerprint"], equals: fingerprint }
            },
            select: { id: true }
        });
        if (existed) return;

        const seen = await prisma.session.findFirst({
            where: {
                userId,
                OR: [{ lastSeenAt: { gte: since } }, { expires: { gte: since } }],
                ip: ip || undefined,
                userAgent: ua || undefined,
                city: city || undefined
            },
            select: { id: true }
        });
        if (seen) return;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true }
        });
        const to = user?.email;
        if (to) {
            const subject = `New login on MyReminder from ${city || "Unknown city"}`;
            const html = `
               <div style="font-family:Inter,system-ui,Arial,sans-serif">
                 <h2>New device login detected</h2>
                 <p>We noticed a sign-in from a new device in the last 45 days.</p>
                 <ul>
                   <li><b>City:</b> ${city || "Unknown"}</li>
                   <li><b>IP:</b> ${ip || "Unknown"}</li>
                   <li><b>User Agent:</b> ${ua || "Unknown"}</li>
                   <li><b>Time:</b> ${new Date().toLocaleString()}</li>
                 </ul>
                 <p>If this wasn't you, please enable 2FA and revoke other sessions.</p>
               </div>`;
            try { await sendSecurityAlertEmail({ to, subject, html }); } catch { }
        }

        await prisma.securityEvent.create({
            data: {
                userId,
                type: "SECURITY_LOGIN_ALERT",
                ip: ip || null,
                userAgent: ua || null,
                meta: { fingerprint, city: city || null }
            }
        });
    } catch (e) {
        console.error("maybeAlertNewDevice error:", e?.message);
    }
}
