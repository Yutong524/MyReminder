// src/app/api/account/quiet-hours/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toMinutes } from "@/lib/quiet-hours";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            quietStartMin: true,
            quietEndMin: true,
            quietDays: true
        }
    });

    return NextResponse.json({
        quietStartMin: u?.quietStartMin ?? null,
        quietEndMin: u?.quietEndMin ?? null,
        quietDays: u?.quietDays ?? []
    });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    let { quietStartMin, quietEndMin, quietDays, quietStart, quietEnd } = body;

    if (quietStart == null && quietEnd == null) {
        if (quietStartMin != null && (quietStartMin < 0 || quietStartMin > 1439)) {
            return NextResponse.json(
                { error: "quietStartMin out of range" },
                { status: 400 }
            );
        }
        if (quietEndMin != null && (quietEndMin < 0 || quietEndMin > 1439)) {
            return NextResponse.json(
                { error: "quietEndMin out of range" },
                { status: 400 }
            );
        }
    } else {
        quietStartMin = toMinutes(quietStart);
        quietEndMin = toMinutes(quietEnd);
        if (quietStart && quietStartMin == null) {
            return NextResponse.json(
                { error: "Invalid quietStart HH:mm" },
                { status: 400 }
            );
        }
        if (quietEnd && quietEndMin == null) {
            return NextResponse.json(
                { error: "Invalid quietEnd HH:mm" },
                { status: 400 }
            );
        }
    }

    if (quietDays && !Array.isArray(quietDays)) {
        return NextResponse.json(
            { error: "quietDays must be an array of 0..6" },
            { status: 400 }
        );
    }
    if (Array.isArray(quietDays)) {
        for (const d of quietDays) {
            if (typeof d !== "number" || d < 0 || d > 6) {
                return NextResponse.json(
                    { error: "quietDays must contain integers 0..6" },
                    { status: 400 }
                );
            }
        }
    }

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            quietStartMin: quietStartMin ?? null,
            quietEndMin: quietEndMin ?? null,
            quietDays: quietDays ?? []
        },
        select: {
            quietStartMin: true,
            quietEndMin: true,
            quietDays: true
        }
    });

    return NextResponse.json({ ok: true, ...updated });
}
