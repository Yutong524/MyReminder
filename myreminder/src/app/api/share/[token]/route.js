import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildTree(rows) {
    const byId = new Map(rows.map(r => [r.id, { ...r, children: [] }]));
    const roots = [];
    for (const r of rows) {
        if (r.parentId && byId.has(r.parentId)) {
            byId.get(r.parentId).children.push(byId.get(r.id));
        } else {
            roots.push(byId.get(r.id));
        }
    }
    return roots;
}

export async function GET(_req, { params }) {
    const token = params?.token || "";
    if (!token) return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
    );

    const root = await prisma.folder.findFirst({
        where: {
            publicEnabled: true,
            publicToken: token
        },
        select: {
            id: true,
            name: true,
            userId: true
        },
    });
    if (!root) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const all = await prisma.folder.findMany({
        where: { userId: root.userId },
        select: {
            id: true,
            name: true,
            parentId: true
        },
    });

    const children = new Map();
    for (const f of all) {
        const arr = children.get(f.parentId || "_root") || [];
        arr.push(f);
        children.set(f.parentId || "_root", arr);
    }

    const queue = [root.id];
    const picked = new Set([root.id]);
    while (queue.length) {
        const cur = queue.shift();
        const kids = children.get(cur) || [];
        for (const k of kids) {
            if (!picked.has(k.id)) {
                picked.add(k.id);
                queue.push(k.id);
            }
        }
    }

    const subtree = all.filter(f => picked.has(f.id)).map(f => ({ ...f }));

    const items = await prisma.folderItem.findMany({
        where: {
            folderId: {
                in: Array.from(picked)
            }
        },
        select: {
            id: true,
            alias: true,
            folderId: true,
            moment: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    isEpic: true,
                    theme: true
                }
            },
        },
    });

    return NextResponse.json({
        root: {
            id: root.id,
            name: root.name
        },
        tree: buildTree(subtree),
        items,
    });
}
