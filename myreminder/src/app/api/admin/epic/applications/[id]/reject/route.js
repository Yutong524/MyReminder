import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admins';

export async function POST(req, { params }) {
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return NextResponse.json({ error: 'Forbidden' },
            { status: 403 }
        );
    }
    const { id } = await params;
    const { reason } = await req.json().catch(() => ({}));

    const app = await prisma.epicApplication.findUnique({
        where: { id },
        select: { id: true, status: true, momentId: true }
    });
    if (!app || app.status !== 'PENDING') {
        return NextResponse.json({ error: 'Invalid application' },
            { status: 400 }
        );
    }

    await prisma.$transaction([
        prisma.epicApplication.update({
            where: { id },
            data: {
                status: 'REJECTED',
                decidedById: session.user.id,
                decidedAt: new Date(),
                reason: (reason || '').trim() || null
            }
        })
    ]);

    return NextResponse.json({ ok: true });
}
