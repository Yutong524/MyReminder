import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    buildPublicUrl,
    tokenHint,
    loadFolderAndRole,
    listMembers,
} from "@/lib/folder-sharing";

export async function GET(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const ctx = await loadFolderAndRole({
        folderId: id,
        currentUserId: session.user.id,
    });

    if (!ctx) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const members = await listMembers(id);

    return NextResponse.json({
        publicEnabled: ctx.folder.publicEnabled,
        publicUrl:
            ctx.folder.publicEnabled && ctx.folder.publicToken
                ? buildPublicUrl(ctx.folder.publicToken)
                : null,
        tokenHint: ctx.folder.publicToken ? tokenHint(ctx.folder.publicToken) : null,
        myRole: ctx.myRole,
        members,
    });
}

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { publicEnabled } = await req.json().catch(() => ({}));

    const ctx = await loadFolderAndRole({
        folderId: id,
        currentUserId: session.user.id,
    });

    if (!ctx) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!ctx.canTogglePublic) {
        return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    await prisma.folder.update({
        where: { id },
        data: { publicEnabled: !!publicEnabled },
    });

    return NextResponse.json({ ok: true });
}
