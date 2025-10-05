import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user?.email) {
        return NextResponse.json(
            { error: "Sign in required" },
            { status: 401 }
        );
    }

    const { token } = await req.json().catch(() => ({}));
    const t = String(token || "");
    if (!t) return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
    );

    const inv = await prisma.folderInvite.findUnique({ where: { token: t } });
    if (!inv) return NextResponse.json(
        { error: "Invalid invite" },
        { status: 404 }
    );
    if (inv.acceptedAt) return NextResponse.json(
        { error: "Already accepted" },
        { status: 409 }
    );
    if (new Date() > inv.expiresAt) return NextResponse.json(
        { error: "Invite expired" },
        { status: 410 }
    );

    const email = String(session.user.email).toLowerCase();
    if (email !== inv.email.toLowerCase()) {
        return NextResponse.json(
            { error: "This invite was sent to a different email" },
            { status: 403 }
        );
    }

    const exists = await prisma.folderMember.findFirst({
        where: {
            folderId: inv.folderId,
            userId: session.user.id
        }
    });
    if (!exists) {
        await prisma.folderMember.create({
            data: {
                folderId: inv.folderId,
                userId: session.user.id,
                role: inv.role
            }
        });
    }

    await prisma.folderInvite.update({
        where: { id: inv.id },
        data: {
            acceptedAt: new Date(),
            acceptedByUserId: session.user.id
        }
    });

    await logSecurityEvent({
        userId: session.user.id,
        type: "INVITE_ACCEPTED",
        req,
        meta: {
            folderId: inv.folderId,
            inviteId: inv.id
        }
    });

    return NextResponse.json({ ok: true, folderId: inv.folderId });
}
