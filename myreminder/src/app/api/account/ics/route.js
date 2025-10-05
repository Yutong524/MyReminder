import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            icsEnabled: true,
            icsToken: true,
            icsTimezone: true,
            icsIncludeFollowing: true
        }
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.json({
        enabled: !!me?.icsEnabled,
        timezone: me?.icsTimezone || null,
        includeFollowing: !!me?.icsIncludeFollowing,
        url: me?.icsEnabled && me?.icsToken ? `${base}/api/ics/${me.icsToken}.ics` : null
    });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { enabled, rotate, timezone, includeFollowing } = await req.json().catch(() => ({}));

    const data = {};
    if (typeof enabled === "boolean") {
        data.icsEnabled = enabled;
        if (enabled) {
            const me = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { icsToken: true }
            });
            if (!me?.icsToken) data.icsToken = cryptoRandom(24);
        }
    }
    if (rotate) data.icsToken = cryptoRandom(24);
    if (typeof timezone === "string") data.icsTimezone = timezone || null;
    if (typeof includeFollowing === "boolean") data.icsIncludeFollowing = includeFollowing;

    const saved = await prisma.user.update({
        where: { id: session.user.id },
        data,
        select: {
            icsEnabled: true,
            icsToken: true,
            icsTimezone: true,
            icsIncludeFollowing: true
        }
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.json({
        ok: true,
        enabled: saved.icsEnabled,
        timezone: saved.icsTimezone,
        includeFollowing: saved.icsIncludeFollowing,
        url: (saved.icsEnabled && saved.icsToken) ? `${base}/api/ics/${saved.icsToken}.ics` : null
    });
}

function cryptoRandom(bytes = 24) {
    return require("crypto").randomBytes(bytes).toString("base64url");
}
