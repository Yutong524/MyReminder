import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jar = cookies();
    const currentToken =
        jar.get("__Secure-next-auth.session-token")?.value ||
        jar.get("next-auth.session-token")?.value ||
        "";

    const { sessionId, allOthers } = await req.json().catch(() => ({}));

    if (allOthers) {
        await prisma.session.deleteMany({
            where: { userId: session.user.id, NOT: { sessionToken: currentToken } }
        });
        await logSecurityEvent({ userId: session.user.id, type: "SESSION_REVOKED", req });
        return NextResponse.json({ ok: true });
    }

    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const s = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!s || s.userId !== session.user.id)
        return NextResponse.json(
            { error: "Not found" },
            { status: 404 }
        );
    if (s.sessionToken === currentToken)
        return NextResponse.json(
            { error: "Cannot revoke current session" },
            { status: 400 }
        );

    await prisma.session.delete(
        {
            where: {
                id: sessionId
            }
        });
    await logSecurityEvent({
        userId: session.user.id,
        type: "SESSION_REVOKED", req
    });
    return NextResponse.json({ ok: true });
}
