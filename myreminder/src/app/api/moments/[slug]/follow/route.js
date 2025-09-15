import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { slug } = params;
    const moment = await prisma.moment.findUnique({ where: { slug }, select: { id: true, userId: true } });
    if (!moment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (moment.userId === session.user.id) {
        return NextResponse.json({ error: 'Cannot follow your own countdown' }, { status: 400 });
    }

    let op = 'follow';
    const ctype = req.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
        const body = await req.json().catch(() => ({}));
        if (body?.op) op = body.op;
    } else if (ctype.includes('application/x-www-form-urlencoded') || ctype.includes('multipart/form-data')) {
        const form = await req.formData();
        op = form.get('op') || 'follow';
    }

    if (op === 'unfollow') {
        await prisma.follow.deleteMany({
            where: { userId: session.user.id, momentId: moment.id }
        });
        return NextResponse.json({ ok: true, followed: false });
    }

    try {
        await prisma.follow.create({
            data: { userId: session.user.id, momentId: moment.id }
        });
    } catch (e) {
    }
    return NextResponse.json({ ok: true, followed: true });
}
