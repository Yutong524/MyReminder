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

    const f = await prisma.folder.findFirst({
        where: {
            id,
            userId: session.user.id
        },
        select:
            { id: true }
    });
    if (!f) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const items = await prisma.folderItem.findMany({
        where: { folderId: id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
            id: true, alias: true, momentId: true,
            moment: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    isEpic: true,
                    theme: true,
                    views: true,
                    cheerCount: true,
                    createdAt: true
                }
            }
        }
    });

    return NextResponse.json({ items });
}

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    const id = String(params.id);
    const { momentId, alias } = await req.json().catch(() => ({}));

    const f = await prisma.folder.findFirst({
        where: {
            id,
            userId: session.user.id
        },
        select:
            { id: true }
    });
    if (!f) return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
    );

    const m = await prisma.moment.findFirst({
        where: {
            id: String(momentId || ""),
            userId: session.user.id
        },
        select: { id: true }
    });
    if (!m) return NextResponse.json(
        { error: "Moment not found" },
        { status: 404 }
    );

    const it = await prisma.folderItem.upsert({
        where: {
            folderId_momentId:
            {
                folderId: id,
                momentId: m.id
            }
        },
        update: { alias: typeof alias === "string" ? alias.trim() : null },
        create: {
            folderId: id,
            momentId: m.id,
            alias: typeof alias === "string" ? alias.trim() : null
        }
    });

    return NextResponse.json({ ok: true, itemId: it.id });
}
