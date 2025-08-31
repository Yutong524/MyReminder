export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toCsv(rows) {
    if (!rows.length) return 'id,title,slug,visibility,timeZone,targetUtc,createdAt,updatedAt\n';
    const esc = (v) => {
        if (v == null) return '';
        const s = String(v);
        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['id', 'title', 'slug', 'visibility', 'timeZone', 'targetUtc', 'createdAt', 'updatedAt'];
    const lines = rows.map(r => header.map(k => esc(r[k])).join(','));
    return [header.join(','), ...lines].join('\n');
}

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const format = (searchParams.get('format') || 'json').toLowerCase();

        const moments = await prisma.moment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                rules: true,
                jobs: true,
                logs: true,
            },
        });

        if (format === 'csv') {
            const csv = toCsv(moments.map(m => ({
                id: m.id,
                title: m.title,
                slug: m.slug,
                visibility: m.visibility,
                timeZone: m.timeZone,
                targetUtc: m.targetUtc.toISOString(),
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString(),
            })));
            const fname = `myreminder-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
            return new Response(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${fname}"`,
                },
            });
        }

        const payload = {
            meta: {
                exportedAt: new Date().toISOString(),
                userId,
                email: session.user.email || null,
                version: 1,
            },
            moments: moments.map(m => ({
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
            })),
        };

        const fname = `myreminder-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
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
