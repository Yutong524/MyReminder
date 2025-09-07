export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: { id: true, userId: true, views: true, uniques: true }
    });
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (m.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const days = await prisma.viewDay.findMany({
        where: { momentId: m.id, day: { gte: new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate())) } },
        orderBy: { day: 'asc' },
        select: { day: true, views: true, uniques: true }
    });
    const refs = await prisma.referrerStat.findMany({
        where: { momentId: m.id },
        orderBy: { count: 'desc' },
        take: 10,
        select: { host: true, count: true }
    });

    return NextResponse.json({
        ok: true,
        totals: { views: m.views, uniques: m.uniques },
        last30d: days.map(d => ({ day: d.day.toISOString().slice(0, 10), views: d.views, uniques: d.uniques })),
        topReferrers: refs
    });
}
