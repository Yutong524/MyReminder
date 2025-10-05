import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadFolderAndRole } from "@/lib/folder-sharing";
import { randomToken, logSecurityEvent } from "@/lib/security";
import { sendSecurityAlertEmail } from "@/lib/mailer";

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
    const targetEmail = String(email).trim().toLowerCase();
    if (targetEmail === (session.user.email || "").toLowerCase()) {
        return NextResponse.json(
            { error: "You cannot invite yourself" },
            { status: 400 }
        );
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: targetEmail },
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    if (existingUser) {
        await prisma.folderMember.upsert({
            where: {
                folderId_userId: {
                    folderId: id,
                    userId: existingUser.id
                }
            },
            create: { folderId: id, userId: existingUser.id, role },
            update: { role }
        });

        await logSecurityEvent({
            userId: session.user.id,
            type: "MEMBER_INVITED",
            req,
            meta: {
                folderId: id,
                email: targetEmail,
                role, mode: "added"
            }
        });

        return NextResponse.json({ ok: true, added: true });
    }

    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.folderInvite.deleteMany({
        where: {
            folderId: id,
            email: targetEmail
        }
    });

    const inv = await prisma.folderInvite.create({
        data: {
            folderId: id,
            email: targetEmail,
            role,
            token,
            expiresAt
        }
    });

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const acceptUrl = `${base}/share/invite/accept?token=${encodeURIComponent(inv.token)}`;
    const subject = "You've been invited to a shared folder on MyReminder";
    const html = `
      <div style="font-family:Inter,system-ui,Arial,sans-serif">
        <h2>Folder invitation</h2>
        <p>You were invited as <b>${role}</b> to a shared folder.</p>
        <p>This invite expires on <b>${expiresAt.toLocaleString()}</b>.</p>
        <p><a href="${acceptUrl}">Accept invitation</a></p>
        <p>If you don't have an account yet, you'll be asked to sign up first.</p>
      </div>`;
    try {
        await sendSecurityAlertEmail({ to: targetEmail, subject, html });
    } catch (e) {
        return NextResponse.json({
            ok: true,
            invited: true,
            emailSent: false
        });
    }

    await logSecurityEvent({
        userId: session.user.id,
        type: "MEMBER_INVITED",
        req,
        meta: {
            folderId: id,
            email: targetEmail,
            role,
            mode: "invited",
            inviteId: inv.id
        }
    });

    return NextResponse.json({
        ok: true,
        invited: true,
        emailSent: true
    });
}
