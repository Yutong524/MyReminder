import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const items = await prisma.securityEvent.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10
    });

    return NextResponse.json({ items });
}
