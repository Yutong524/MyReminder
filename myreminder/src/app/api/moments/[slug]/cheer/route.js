export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

function ipFrom(req) {
    const f = req.headers.get('x-forwarded-for') || '';
    return f.split(',')[0].trim() || '0.0.0.0';
}

function h(x) {
    const salt = process.env.CHEER_SALT || process.env.AUTH_SECRET || 'salt';
    return crypto.createHash('sha256').update(salt + '|' + x).digest('hex');
}

export async function POST(req, { params }) {
    const { slug } = await params;
    const m = await prisma.moment.findUnique({ where: { slug }, select: { id: true, cheerCount: true, ownerEmail: true, notifyOnCheer: true, title: true } });
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const ip = ipFrom(req), ipHash = h(ip + ':' + slug);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existed = await prisma.cheer.findFirst({ where: { momentId: m.id, ipHash, createdAt: { gte: since } } });
    if (existed) {
        return NextResponse.json({ ok: true, already: true, count: m.cheerCount });
    }
    await prisma.$transaction([
        prisma.cheer.create({ data: { momentId: m.id, ipHash } }),
        prisma.moment.update({ where: { id: m.id }, data: { cheerCount: { increment: 1 } } })
    ]);

    if (m.notifyOnCheer && m.ownerEmail) {
        (async () => {
            try {
                await sendEmail({
                    to: m.ownerEmail,
                    subject: `New cheer for "${m.title}"`,
                    text: `Someone cheered your countdown "${m.title}".`
                });
            } catch { }
        })();
    }
    const fresh = await prisma.moment.findUnique({ where: { id: m.id }, select: { cheerCount: true } });
    return NextResponse.json({ ok: true, count: fresh?.cheerCount || (m.cheerCount + 1) });
}
