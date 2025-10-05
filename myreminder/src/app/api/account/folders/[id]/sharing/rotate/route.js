import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomToken } from "@/lib/crypto";
import { loadFolderAndRole } from "@/lib/folder-sharing";

export async function POST(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { id } = params;
    const ctx = await loadFolderAndRole({
        folderId: id,
        currentUserId:
            session.user.id
    });
    if (!ctx) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );
    if (!ctx.canTogglePublic) return NextResponse.json(
        { error: "No permission" },
        { status: 403 }
    );

    const token = randomToken(24);
    await prisma.folder.update({
        where: { id },
        data: {
            publicToken: token,
            publicEnabled: true,
            publicUpdatedAt: new Date()
        },
    });

    return NextResponse.json({
        ok: true,
        token
    });
}
