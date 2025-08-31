export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    try {
        const { slug } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const m = await prisma.moment.findUnique({
            where: { slug },
            include: { rules: true, jobs: true, logs: true }
        });
        if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (m.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const payload = {
            meta: {
                exportedAt: new Date().toISOString(),
                slug,
                version: 1,
            },
            moment: {
                ...m,
                targetUtc: m.targetUtc.toISOString(),
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
                jobs: m.jobs.map(j => ({
                    ...j,
                    scheduledAt: j.scheduledAt.toISOString(),
                    sentAt: j.sentAt ? j.sentAt.toISOString() : null,
                    deliveredAt: j.deliveredAt ? j.deliveredAt.toISOString() : null,
                    createdAt: j.createdAt.toISOString(),
                    updatedAt: j.updatedAt.toISOString(),
                })),
                logs: m.logs.map(l => ({
                    ...l,
                    createdAt: l.createdAt.toISOString(),
                })),
            }
        };

        const fname = `myreminder-${slug}-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        return new Response(JSON.stringify(payload, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Disposition': `attachment; filename="${fname}"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
