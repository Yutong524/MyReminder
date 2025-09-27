import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { touchCurrentSession } from "@/lib/security";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ ok: true });

    const jar = cookies();
    const token =
        jar.get("__Secure-next-auth.session-token")?.value ||
        jar.get("next-auth.session-token")?.value ||
        "";

    await touchCurrentSession({
        req,
        userId: session.user.id,
        sessionToken: token
    });
    return NextResponse.json({ ok: true });
}
