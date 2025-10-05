import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword } from "@/lib/security";

function pwCookieKey(folderId) { return `f_pw_${folderId}`; }

export async function GET(req, { params }) {
    const token = String(params.token || "");
    const folder = await prisma.folder.findFirst({
        where: {
            publicEnabled: true,
            publicToken: token
        },
        select: {
            id: true,
            name: true,
            userId: true,
            publicExpiresAt: true,
            publicPasswordHash: true,
            children: {
                select: {
                    id: true,
                    name: true,
                    parentId: true
                }
            },
            items: {
                select: {
                    id: true,
                    alias: true,
                    sortOrder: true,
                    moment: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            theme: true,
                            isEpic: true
                        }
                    }
                },
                orderBy: [
                    { sortOrder: "asc" },
                    { createdAt: "asc" }
                ]
            }
        }
    });

    if (!folder) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    if (folder.publicExpiresAt && new Date() > folder.publicExpiresAt) {
        return NextResponse.json(
            { error: "Link expired" },
            { status: 410 }
        );
    }

    if (folder.publicPasswordHash) {
        const cookieVal = req.cookies.get(pwCookieKey(folder.id))?.value || "";
        if (cookieVal !== "1") {
            return NextResponse.json(
                { requirePassword: true },
                { status: 401 })
                ;
        }
    }

    return NextResponse.json({
        folder: {
            id: folder.id,
            name: folder.name
        },
        items: folder.items.map(it => ({
            id: it.id,
            alias: it.alias,
            moment: it.moment
        }))
    });
}

export async function POST(req, { params }) {
    const token = String(params.token || "");
    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "");

    const folder = await prisma.folder.findFirst({
        where: {
            publicEnabled: true,
            publicToken: token
        },
        select: {
            id: true,
            publicExpiresAt: true,
            publicPasswordHash: true
        }
    });
    if (!folder) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    if (folder.publicExpiresAt && new Date() > folder.publicExpiresAt) {
        return NextResponse.json(
            { error: "Link expired" },
            { status: 410 }
        );
    }

    if (!folder.publicPasswordHash) {
        const res = NextResponse.json({ ok: true, unlocked: true });
        res.cookies.set(pwCookieKey(folder.id), "1", {
            httpOnly: true,
            sameSite: "Lax",
            maxAge: 3600 * 24
        }
        );
        return res;
    }

    const ok = await checkPassword(password, folder.publicPasswordHash);
    if (!ok) return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
    );

    const res = NextResponse.json(
        {
            ok: true,
            unlocked: true
        }
    );
    res.cookies.set(pwCookieKey(folder.id), "1", {
        httpOnly: true,
        sameSite: "Lax",
        maxAge: 3600 * 24
    });

    return res;
}
