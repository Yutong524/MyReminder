import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const id = String(params.id);
    const folder = await prisma.folder.findUnique({ where: { id } });
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

    const invites = await prisma.folderInvite.findMany({
        where: {
            folderId: id,
            acceptedAt: null
        },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
        items: invites.map(v => ({
            id: v.id,
            email: v.email,
            role: v.role,
            expiresAt: v.expiresAt
        }))
    });
}
