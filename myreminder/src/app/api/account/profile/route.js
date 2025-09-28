import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, image } = await req.json().catch(() => ({}));
    const updates = {};

    if (typeof name === 'string') {
        const n = name.trim();
        if (n.length > 60) {
            return NextResponse.json({
                error: 'Name too long (max 60)'
            },
                {
                    status: 400
                }
            );
        }
        updates.name = n || null;
    }

    if (typeof image === 'string') {
        const url = image.trim();
        if (url) {
            try {
                const u = new URL(url);
                if (!/^https?:$/.test(u.protocol)) throw new Error('bad proto');
            } catch {
                return NextResponse.json({ error: 'Image URL must be http(s)' }, { status: 400 });
            }
            updates.image = url;
        } else {
            updates.image = null;
        }
    }

    if (!Object.keys(updates).length) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updates,
        select: { name: true, image: true }
    });

    await logSecurityEvent({
        userId: session.user.id,
        type: 'PROFILE_UPDATED',
        meta: { fields: Object.keys(updates) }
    });

    return NextResponse.json({ ok: true, user });
}
