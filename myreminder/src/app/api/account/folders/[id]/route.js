import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const id = String(params.id || "");
    const body = await req.json().catch(() => ({}));

    const name =
        typeof body.name === "string" ? body.name.trim() : undefined;

    const parentId =
        body.parentId === null
            ? null
            : typeof body.parentId === "string"
                ? body.parentId
                : undefined;

    const f = await prisma.folder.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            parentId: true,
            userId: true
        },
    });
    if (!f) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const isOwner = f.userId === session.user.id;
    const isMemberOwner = await prisma.folderMember.findFirst({
        where: { folderId: id, userId: session.user.id, role: "OWNER" },
        select: { id: true },
    });
    if (!isOwner && !isMemberOwner) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    if (parentId !== undefined) {
        if (parentId) {
            const p = await prisma.folder.findUnique({
                where: { id: parentId },
                select: {
                    id: true,
                    userId: true,
                    parentId: true
                },
            });
            if (!p) return NextResponse.json(
                { error: "Parent not found" },
                { status: 404 }
            );

            if (parentId === id) {
                return NextResponse.json(
                    { error: "Invalid parent" },
                    { status: 400 }
                );
            }

            if (p.userId !== f.userId) {
                return NextResponse.json(
                    { error: "Cannot move across owners" },
                    { status: 400 }
                );
            }

            let cursor = p;
            while (cursor?.parentId) {
                if (cursor.parentId === id) {
                    return NextResponse.json(
                        { error: "Cannot move into its descendant" },
                        { status: 400 }
                    );
                }
                cursor = await prisma.folder.findUnique({
                    where: { id: cursor.parentId },
                    select: { id: true, parentId: true },
                });
            }
        }
    }

    try {
        const updated = await prisma.folder.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(parentId !== undefined ? { parentId } : {}),
            },
            select: { id: true, name: true, parentId: true },
        });

        return NextResponse.json({
            ok: true,
            folder: updated
        });
    } catch (e) {
        const msg = (e && e.code === "P2002")
            ? "Name already exists under the same parent"
            : "Update failed";
        const status = e && e.code === "P2002" ? 409 : 500;
        return NextResponse.json(
            { error: msg },
            { status }
        );
    }
}

export async function DELETE(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const id = String(params.id || "");

    const f = await prisma.folder.findUnique({
        where: { id },
        select: { id: true, userId: true },
    });
    if (!f) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const isOwner = f.userId === session.user.id;
    const isMemberOwner = await prisma.folderMember.findFirst({
        where: { folderId: id, userId: session.user.id, role: "OWNER" },
        select: { id: true },
    });
    if (!isOwner && !isMemberOwner) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    await prisma.folder.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}
