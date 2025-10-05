import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomToken, logSecurityEvent } from "@/lib/security";

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const id = String(params.id);
    const folder = await prisma.folder.findUnique({
        where: { id }
    });
    if (!folder) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const isOwner = folder.userId === session.user.id;
    const member = await prisma.folderMember.findFirst({
        where: {
            folderId: id,
            userId: session.user.id
        }
    });
    const role = isOwner ? "OWNER" : (member?.role || null);
    if (!(isOwner || role === "OWNER")) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    if (!folder.publicEnabled) {
        return NextResponse.json(
            { error: "Public link disabled" },
            { status: 400 }
        );
    }

    const saved = await prisma.folder.update({
        where: { id },
        data: { publicToken: randomToken(24) }
    });

    await logSecurityEvent({
        userId: session.user.id,
        type: "PUBLIC_LINK_CONFIGURED",
        req,
        meta: {
            folderId: id,
            rotated: true
        }
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.json({
        ok: true,
        publicUrl: `${base}/share/${saved.publicToken}`
    });
}
