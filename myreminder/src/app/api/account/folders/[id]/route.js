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

    const id = String(params.id);

    const body = await req.json().catch(() => ({}));

    const name =
        typeof body.name === "string"
            ? body.name.trim()
            : undefined;

    const parentId =
        body.parentId === null
            ? null
            : (typeof body.parentId === "string"
                ? body.parentId
                : undefined);

    const f = await prisma.folder.findFirst({
        where: {
            id,
            userId: session.user.id
        }
    });

    if (!f) {
        return NextResponse.json(
            { error: "Not found" },
            { status: 404 }
        );
    }

    if (parentId !== undefined) {
        if (parentId) {
            const p = await prisma.folder.findFirst({
                where: {
                    id: parentId,
                    userId: session.user.id
                },
                select: { id: true }
            });

            if (!p) {
                return NextResponse.json(
                    { error: "Parent not found" },
                    { status: 404 }
                );
            }

            if (parentId === id) {
                return NextResponse.json(
                    { error: "Invalid parent" },
                    { status: 400 }
                );
            }
        }
    }

    const updated = await prisma.folder.update({
        where: { id },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(parentId !== undefined ? { parentId } : {})
        }
    });

    return NextResponse.json(
        {
            ok: true,
            folder: {
                id: updated.id,
                name: updated.name,
                parentId: updated.parentId
            }
        }
    );
}

export async function DELETE(_req, { params }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const id = String(params.id);

    const f = await prisma.folder.findFirst({
        where: {
            id,
            userId: session.user.id
        },
        select: { id: true }
    });

    if (!f) {
        return NextResponse.json(
            { error: "Not found" },
            { status: 404 }
        );
    }

    await prisma.folder.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}
