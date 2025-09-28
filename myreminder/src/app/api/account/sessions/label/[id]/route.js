import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security';

export async function PATCH(req, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const id = String(params?.id || '');
    const { label } = await req.json().catch(() => ({}));

    if (typeof label !== 'string') {
        return NextResponse.json({ error: 'Invalid label' }, { status: 400 });
    }
    if (label.trim().length > 60) {
        return NextResponse.json({ error: 'Label too long (max 60)' }, { status: 400 });
    }

    const sess = await prisma.session.findUnique({
        where: { id },
        select: { id: true, userId: true }
    });
    if (!sess || sess.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.session.update({
        where: { id },
        data: { label: label.trim() || null },
        select: { id: true, label: true }
    });

    await logSecurityEvent({
        userId: session.user.id,
        type: 'SESSION_LABELED',
        meta: { sessionId: id, label: updated.label || '' }
    });

    return NextResponse.json({ ok: true, session: updated });
}
