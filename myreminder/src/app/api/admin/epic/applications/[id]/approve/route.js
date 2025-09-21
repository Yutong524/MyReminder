import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admins';

export async function POST(req, { params }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { category } = await req.json().catch(() => ({}));

    const app = await prisma.epicApplication.findUnique({
        where: { id },
        select: { id: true, status: true, category: true, momentId: true }
    });
    
    if (!app || app.status !== 'PENDING') {
        return NextResponse.json({ error: 'Invalid application' }, { status: 400 });
    }

    const cat = (category || app.category || '').trim() || null;

    await prisma.$transaction([
        prisma.moment.update({
            where: { id: app.momentId },
            data: { isEpic: true, epicCategory: cat }
        }),
        prisma.epicApplication.update({
            where: { id },
            data: {
                status: 'APPROVED',
                decidedById: session.user.id,
                decidedAt: new Date(),
                reason: null
            }
        })
    ]);

    return NextResponse.json({ ok: true });
}
