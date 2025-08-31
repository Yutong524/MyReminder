import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req, { params }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const m = await prisma.moment.findUnique({ where: { slug }, select: { id: true, userId: true } });
    if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (m.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.moment.delete({ where: { id: m.id } });
    return NextResponse.redirect(new URL("/dashboard", req.url));
}
