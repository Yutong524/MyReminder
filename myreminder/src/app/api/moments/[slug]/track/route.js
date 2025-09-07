export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function ipFrom(req) {
    const f = req.headers.get('x-forwarded-for') || '';
    return f.split(',')[0].trim() || '0.0.0.0';
}
function dayStartUTC(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function hashIp({ ip, slug, day }) {
    const salt = process.env.ANALYTICS_SALT || process.env.AUTH_SECRET || 'salt';
    return crypto.createHash('sha256').update(`${salt}|${ip}|${slug}|${day.toISOString()}`).digest('hex').slice(0, 16);
}
function hostFromRef(ref, selfOrigin) {
    try {
        const h = new URL(ref).host.toLowerCase();
        const selfHost = selfOrigin ? new URL(selfOrigin).host.toLowerCase() : '';
        if (!h || (selfHost && h === selfHost)) return null;
        return h;
    } catch { return null; }
}

export async function POST(req, { params }) {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const ref = typeof body.ref === 'string' ? body.ref : '';
    const selfOrigin = typeof body.selfOrigin === 'string' ? body.selfOrigin : '';

    const moment = await prisma.moment.findUnique({ where: { slug }, select: { id: true } });
    if (!moment) return NextResponse.json({ ok: true });

    const now = new Date();
    const day = dayStartUTC(now);
    const ip = ipFrom(req);
    const ipHash = hashIp({ ip, slug, day });
    const refHost = hostFromRef(ref, selfOrigin);

    try {
        await prisma.$transaction(async (tx) => {
            await tx.viewDay.upsert({
                where: { momentId_day: { momentId: moment.id, day } },
                update: { views: { increment: 1 } },
                create: { momentId: moment.id, day, views: 1, uniques: 0 },
            });

            if (refHost) {
                await tx.referrerStat.upsert({
                    where: { momentId_host: { momentId: moment.id, host: refHost } },
                    update: { count: { increment: 1 } },
                    create: { momentId: moment.id, host: refHost, count: 1 },
                });
            }

            const created = await tx.uniqueSeen.create({
                data: { momentId: moment.id, day, ipHash },
            }).then(() => true).catch(() => false);

            if (created) {
                await tx.viewDay.update({
                    where: { momentId_day: { momentId: moment.id, day } },
                    data: { uniques: { increment: 1 } },
                });
                await tx.moment.update({ where: { id: moment.id }, data: { uniques: { increment: 1 } } });
            }

            await tx.moment.update({ where: { id: moment.id }, data: { views: { increment: 1 } } });
        });
    } catch {
    }

    return NextResponse.json({ ok: true });
}
