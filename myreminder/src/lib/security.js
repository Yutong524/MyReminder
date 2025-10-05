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

export const SECURITY_ALERT_WINDOW_DAYS = 45;

export function getIpUaCityFromRequest(req) {
    const ip = req ? ipFromHeaders(req.headers) : null;
    const userAgent = req ? req.headers.get("user-agent") || null : null;
    const city = req ? cityFromHeaders(req.headers) : null;
    return { ip, userAgent, city };
}

function shortUA(ua) {
    return (ua || "").slice(0, 300);
}


export async function logSecurityEvent({ userId, type, req, meta }) {
    try {
        const { ip, userAgent: ua, city } = getIpUaCityFromRequest(req);
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
        const { ip, userAgent: ua, city } = getIpUaCityFromRequest(req);

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
        const uaShort = shortUA(userAgent);
        const fingerprint = `${ip || "?"}|${city || "?"}|${uaShort || "?"}`;
        const since = new Date(Date.now() - SECURITY_ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

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
                ...(ip ? { ip } : {}),
                ...(city ? { city } : {})
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
                   <li><b>User Agent:</b> ${uaShort || "Unknown"}</li>
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
                userAgent: userAgent || null,
                meta: { fingerprint, city: city || null }
            }
        });
    } catch (e) {
        console.error("maybeAlertNewDevice error:", e?.message);
    }
}
