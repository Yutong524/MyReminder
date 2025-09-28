import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readClientInfo } from "@/lib/geo";
import { maybeAlertNewDevice } from "@/lib/security";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ ok: true });
    }
    const jar = cookies();
    const token =
        jar.get("__Secure-next-auth.session-token")?.value ||
        jar.get("next-auth.session-token")?.value ||
        "";

    const s = await prisma.session.findFirst({
        where: { userId: session.user.id, sessionToken: token },
    });
    if (!s) return NextResponse.json({ ok: true });

    const { ip, userAgent, city } = readClientInfo(req);
    const now = new Date();

    await prisma.session.update({
        where: { id: s.id },
        data: {
            lastSeenAt: now,
            ip: ip || s.ip,
            userAgent: userAgent || s.userAgent,
            city: city || s.city,
        },
    });

    try {
        await maybeAlertNewDevice({
            userId: session.user.id,
            ip,
            userAgent,
            city,
        });
    } catch (e) {
        console.error("maybeAlertNewDevice error:", e?.message);
    }

    return NextResponse.json({ ok: true });
}
