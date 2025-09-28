import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const itemId = String(params.itemId);
    const { alias } = await req.json().catch(() => ({}));

    const it = await prisma.folderItem.findFirst({
        where: { id: itemId, folder: { userId: session.user.id } },
        select: { id: true }
    });
    if (!it) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    await prisma.folderItem.update({
        where: { id: itemId },
        data: { alias: typeof alias === "string" ? alias.trim() : null }
    });

    return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );
    const itemId = String(params.itemId);

    const it = await prisma.folderItem.findFirst({
        where: {
            id: itemId,
            folder: { userId: session.user.id }
        },
        select: { id: true }
    });
    if (!it) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    await prisma.folderItem.delete({
        where: { id: itemId }
    });

    return NextResponse.json({ ok: true });
}
