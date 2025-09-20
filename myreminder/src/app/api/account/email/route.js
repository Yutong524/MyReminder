import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { email } = await req.json().catch(() => ({}));
    const clean = String(email || '').trim().toLowerCase();

    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
        where: { email: clean, NOT: { id: session.user.id } },
        select: { id: true }
    });

    if (exists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { email: clean }
    });

    return NextResponse.json({ ok: true });
}
