import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookieNameFor, issueAccessToken } from '@/lib/access';

export async function POST(req, { params }) {
    const { slug } = await params;
    const { passcode } = await req.json();

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: { visibility: true, passcodeHash: true, title: true },
    });
    if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (m.visibility !== 'PRIVATE') {
        return NextResponse.json({ ok: true, info: 'Not private; no passcode required' });
    }
    if (!m.passcodeHash) {
        return NextResponse.json({ error: 'No passcode set' }, { status: 400 });
    }
    const ok = await bcrypt.compare(passcode || '', m.passcodeHash);
    if (!ok) return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });

    const token = issueAccessToken(slug);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieNameFor(slug), token, {
        httpOnly: true,
        sameSite: 'lax',
        path: `/`,
        maxAge: 60 * 60 * 24 * 7,
    });
    return res;
}
