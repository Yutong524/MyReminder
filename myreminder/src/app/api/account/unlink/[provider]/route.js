import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = String(params?.provider || '').toLowerCase();
    if (!provider) {
        return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
    }

    const ALLOWED = new Set(['google']);
    if (!ALLOWED.has(provider)) {
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider },
        select: { id: true }
    });
    if (!account) {
        return NextResponse.json({ error: 'Not linked' }, { status: 404 });
    }

    const total = await prisma.account.count({ where: { userId: session.user.id } });
    const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true }
    });

    const hasOtherBindings = total > 1;
    const canUseEmail = !!me?.email;
    if (!hasOtherBindings && !canUseEmail) {
        return NextResponse.json(
            { error: 'Cannot unlink: you must keep at least one sign-in method.' },
            { status: 400 }
        );
    }

    await prisma.account.delete({
        where: { id: account.id }
    });

    return NextResponse.json({ ok: true });
}
