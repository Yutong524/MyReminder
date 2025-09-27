import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jar = cookies();
    const token =
        jar.get("__Secure-next-auth.session-token")?.value ||
        jar.get("next-auth.session-token")?.value ||
        "";

    const rows = await prisma.session.findMany({
        where: { userId: session.user.id },
        orderBy: { lastSeenAt: "desc" }
    });

    const items = rows.map((s) => ({
        id: s.id,
        sessionToken: s.sessionToken,
        ip: s.ip || "—",
        userAgent: s.userAgent || "—",
        lastSeenAt: s.lastSeenAt || s.expires,
        expires: s.expires,
        current: s.sessionToken === token
    }));

    return NextResponse.json({ items });
}
