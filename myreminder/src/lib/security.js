import { prisma } from "@/lib/prisma";

export function ipFromHeaders(headers) {
    const h = (k) => headers.get(k) || headers.get(k.toLowerCase());
    const ff = h("x-forwarded-for");
    const ip = ff ? ff.split(",")[0].trim() : h("x-real-ip") || h("cf-connecting-ip") || null;
    return ip || null;
}

export async function logSecurityEvent({ userId, type, req, meta }) {
    try {
        const ip = req ? ipFromHeaders(req.headers) : null;
        const ua = req ? req.headers.get("user-agent") || null : null;
        await prisma.securityEvent.create({
            data: { userId, type, ip, userAgent: ua, meta: meta || null }
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

        const s = await prisma.session.findUnique({ where: { sessionToken } });
        const firstWrite = !s?.ip && !s?.userAgent;
        await prisma.session.update({
            where: { sessionToken },
            data: { ip, userAgent: ua, lastSeenAt: new Date() }
        });
        if (firstWrite) {
            await logSecurityEvent({ userId, type: "SIGN_IN", req });
        }
    } catch (e) {
        console.error("touchSession error:", e?.message);
    }
}
