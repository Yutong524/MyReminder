import { prisma } from "@/lib/prisma";

export const PUBLIC_BASE =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

export function buildPublicUrl(token) {
    return `${PUBLIC_BASE}/share/${token}`;
}

export function tokenHint(token) {
    if (!token) return "";
    if (token.length <= 8) return token;
    return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

export async function loadFolderAndRole({ folderId, currentUserId }) {
    const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: {
            id: true,
            userId: true,
            publicEnabled: true,
            publicToken: true,
            publicUpdatedAt: true,
            name: true,
        },
    });
    if (!folder) return null;

    let myRole = null;
    let isOwner = folder.userId === currentUserId;

    if (!isOwner && currentUserId) {
        const mem = await prisma.folderMember.findFirst({
            where: { folderId, userId: currentUserId },
            select: { role: true },
        });
        myRole = mem?.role || null;
    } else if (isOwner) {
        myRole = "OWNER";
    }

    const canManageMembers = isOwner || myRole === "OWNER";
    const canTogglePublic = isOwner || myRole === "OWNER";

    return { folder, myRole, isOwner, canManageMembers, canTogglePublic };
}

export async function listMembers(folderId) {
    const rows = await prisma.folderMember.findMany({
        where: { folderId },
        select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(r => ({
        id: r.id,
        userId: r.user.id,
        name: r.user.name || null,
        email: r.user.email || "",
        role: r.role,
    }));
}
