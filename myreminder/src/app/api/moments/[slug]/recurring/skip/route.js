export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req, { params }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );

    const m = await prisma.moment.findUnique(
        {
            where: { slug },
            select: {
                id: true,
                userId: true,
                targetUtc: true
            }
        });

    if (!m) return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
    );
    if (m.userId !== session.user.id) return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
    );
    await prisma.recurrenceSkip.create(
        {
            data: {
                momentId: m.id,
                occurrenceUtc: m.targetUtc,
                reason: 'user_skip'
            }
        }
    );

    return NextResponse.json({ ok: true });
}
