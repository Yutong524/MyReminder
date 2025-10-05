import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent, hashPassword, randomToken } from "@/lib/security";

export async function GET(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const id = String(params.id);
    const folder = await prisma.folder.findUnique(
        { where: { id } }
    );
    if (!folder) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const isOwner = folder.userId === session.user.id;
    const member = await prisma.folderMember.findFirst({
        where: {
            folderId: id,
            userId: session.user.id
        }
    });

    const role = isOwner ? "OWNER" : (member?.role || null);
    if (!(isOwner || role === "OWNER")) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const publicUrl = folder.publicEnabled && folder.publicToken
        ? `${base}/share/${folder.publicToken}`
        : null;

    return NextResponse.json({
        publicEnabled: !!folder.publicEnabled,
        publicUrl,
        tokenHint: folder.publicToken ? `${folder.publicToken.slice(0, 4)}…${folder.publicToken.slice(-4)}` : null,
        publicExpiresAt: folder.publicExpiresAt,
        hasPassword: !!folder.publicPasswordHash,
    });
}

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const id = String(params.id);
    const body = await req.json().catch(() => ({}));

    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );

    const isOwner = folder.userId === session.user.id;
    const member = await prisma.folderMember.findFirst({
        where: {
            folderId: id,
            userId: session.user.id
        }
    });
    const role = isOwner ? "OWNER" : (member?.role || null);
    if (!(isOwner || role === "OWNER")) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    const updates = {};

    if (typeof body.publicEnabled === "boolean") {
        updates.publicEnabled = body.publicEnabled;
        if (body.publicEnabled && !folder.publicToken) {
            updates.publicToken = randomToken(24);
        }
    }

    if ("publicExpiresAt" in body) {
        if (body.publicExpiresAt === null || body.publicExpiresAt === "") {
            updates.publicExpiresAt = null;
        } else {
            const d = new Date(String(body.publicExpiresAt));
            if (isNaN(d.getTime()))
                return NextResponse.json(
                    { error: "Invalid publicExpiresAt" },
                    { status: 400 }
                );
            updates.publicExpiresAt = d;
        }
    }

    if ("publicPassword" in body) {
        const pw = String(body.publicPassword || "");
        if (pw === "") {
            updates.publicPasswordHash = null;
        } else {
            updates.publicPasswordHash = await hashPassword(pw);
        }
    }

    const saved = await prisma.folder.update({
        where: { id },
        data: updates
    });

    await logSecurityEvent({
        userId: session.user.id,
        type: "PUBLIC_LINK_CONFIGURED",
        req,
        meta: {
            folderId: id,
            publicEnabled: saved.publicEnabled,
            publicExpiresAt: saved.publicExpiresAt ?? null,
            hasPassword: !!saved.publicPasswordHash
        }
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const publicUrl = saved.publicEnabled && saved.publicToken
        ? `${base}/share/${saved.publicToken}`
        : null;

    return NextResponse.json({
        ok: true,
        publicEnabled: !!saved.publicEnabled,
        publicUrl,
        publicExpiresAt: saved.publicExpiresAt,
        hasPassword: !!saved.publicPasswordHash
    });
}
