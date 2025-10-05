import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadFolderAndRole } from "@/lib/folder-sharing";

const ROLES = new Set(["VIEWER", "EDITOR", "OWNER"]);

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { id } = params;
    const { email, role } = await req.json().catch(() => ({}));

    const ctx = await loadFolderAndRole({
        folderId: id,
        currentUserId:
            session.user.id
    });
    if (!ctx) return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
    );
    if (!(ctx.isOwner || ctx.myRole === "OWNER"))
        return NextResponse.json(
            { error: "No permission" },
            { status: 403 }
        );

    if (!email) return NextResponse.json(
        { error: "Email required" },
        { status: 400 }
    );
    if (!ROLES.has(role)) return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
    );

    const user = await prisma.user.findUnique({
        where: {
            email: String(email).toLowerCase()
        }
    });
    if (!user) return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
    );

    await prisma.folderMember.upsert({
        where: {
            folderId_userId: {
                folderId: id,
                userId: user.id
            }
        },
        create: {
            folderId: id,
            userId: user.id,
            role
        },
        update: { role },
    });

    return NextResponse.json({ ok: true });
}
