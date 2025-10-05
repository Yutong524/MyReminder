import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadFolderAndRole } from "@/lib/folder-sharing";

const ROLES = new Set(["VIEWER", "EDITOR", "OWNER"]);

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { id, memberId } = params;
    const { role } = await req.json().catch(() => ({}));

    const ctx = await loadFolderAndRole({
        folderId: id,
        currentUserId: session.user.id
    });
    if (!ctx) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );
    if (!(ctx.isOwner || ctx.myRole === "OWNER")) {
        return NextResponse.json(
            { error: "No permission" },
            { status: 403 }
        );
    }
    if (!ROLES.has(role)) return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
    );

    await prisma.folderMember.update({
        where:
        {
            id: memberId
        },
        data: { role }
    });
    return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { id, memberId } = params;
    const ctx = await loadFolderAndRole({
        folderId: id,
        currentUserId:
            session.user.id
    });
    
    if (!ctx) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    if (!(ctx.isOwner || ctx.myRole === "OWNER")) {
        return NextResponse.json(
            { error: "No permission" },
            { status: 403 }
        );
    }

    await prisma.folderMember.delete({
        where: {
            id: memberId
        }
    });
    return NextResponse.json({ ok: true });
}
