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

export async function GET(req, { params }) {
    const { slug } = await params;
    const m = await prisma.moment.findUnique({ where: { slug }, select: { id: true } });
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const entries = await prisma.guestbookEntry.findMany({
        where: { momentId: m.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, name: true, message: true, createdAt: true }
    });
    return NextResponse.json({ ok: true, entries });
}

export async function POST(req, { params }) {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const name = (body.name || '').toString().slice(0, 40).trim();
    const message = (body.message || '').toString().slice(0, 280).trim();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });
    const m = await prisma.moment.findUnique({ where: { slug }, select: { id: true, ownerEmail: true, notifyOnNote: true, title: true } });
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const ip = ipFrom(req), ipHash = h(ip + ':' + slug);
    const since = new Date(Date.now() - 60 * 1000);
    const dup = await prisma.guestbookEntry.findFirst({ where: { momentId: m.id, ipHash, createdAt: { gte: since } } });
    if (dup) return NextResponse.json({ error: 'Too frequent' }, { status: 429 });

    const created = await prisma.guestbookEntry.create({
        data: { momentId: m.id, name: name || null, message, ipHash },
        select: { id: true, name: true, message: true, createdAt: true }
    });

    if (m.notifyOnNote && m.ownerEmail) {
        (async () => {
            try {
                await sendEmail({
                    to: m.ownerEmail,
                    subject: `📝 New note for "${m.title}"`,
                    text: `${name || 'Someone'} wrote:\n\n${message}\n`
                });
            } catch { }
        })();
    }
    return NextResponse.json({ ok: true, entry: created });
}
