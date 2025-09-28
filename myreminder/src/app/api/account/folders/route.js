import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildTree(rows) {
    const byId = new Map();
    rows.forEach(r => byId.set(r.id, { ...r, children: [] }));
    const roots = [];
    rows.forEach(r => {
        const node = byId.get(r.id);
        if (r.parentId && byId.has(r.parentId)) {
            byId.get(r.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await prisma.folder.findMany({
        where: { userId: session.user.id },
        orderBy: [
            { parentId: "asc" },
            { name: "asc" }
        ],
        select: {
            id: true,
            name: true,
            parentId: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return NextResponse.json({ tree: buildTree(rows) });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const parentId = body.parentId ? String(body.parentId) : null;

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    if (parentId) {
        const parent = await prisma.folder.findFirst({
            where: {
                id: parentId,
                userId: session.user.id
            },
            select: { id: true }
        });
        if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const f = await prisma.folder.create({
        data: { userId: session.user.id, name, parentId: parentId || null }
    });

    return NextResponse.json({
        ok: true,
        folder: {
            id: f.id,
            name: f.name,
            parentId: f.parentId
        }
    });
}
