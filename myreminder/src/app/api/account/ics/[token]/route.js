import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildICS } from "@/lib/ics";

export async function GET(_req, { params }) {
    const token = String(params.token || "").replace(/\.ics$/i, "");
    if (!token) return text("Not found", 404);

    const user = await prisma.user.findFirst({
        where: {
            icsToken: token,
            icsEnabled: true
        },
        select: {
            id: true,
            icsTimezone: true,
            icsIncludeFollowing: true,
            name: true
        }
    });
    if (!user) return text("Not found", 404);

    const own = await prisma.moment.findMany({
        where: { userId: user.id },
        select: {
            id: true,
            title: true,
            slug: true,
            targetUtc: true
        }
    });
    let extra = [];
    if (user.icsIncludeFollowing) {
        const rows = await prisma.follow.findMany({
            where: { userId: user.id },
            select: {
                moment: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        targetUtc: true
                    }
                }
            }
        });
        extra = rows.map(r => r.moment).filter(Boolean);
    }

    const all = [...own, ...extra];
    const events = all.map(m => ({
        uid: `${m.id}@myreminder`,
        summary: m.title,
        start: new Date(m.targetUtc),
        end: new Date(new Date(m.targetUtc).getTime() + 60 * 60 * 1000),
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/c/${m.slug}`,
        description: `Countdown: /c/${m.slug}`
    }));

    const ics = buildICS({
        prodId: `-//MyReminder//User Feed ${user.name || user.id}//EN`,
        events
    });

    return new NextResponse(ics, {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="myreminder.ics"`
        }
    });
}

function text(s, code = 200) {
    return new NextResponse(s, {
        status: code,
        headers: { "Content-Type": "text/plain" }
    });
}
