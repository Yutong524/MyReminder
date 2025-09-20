import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req, { params }) {
    const { slug } = params;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            id: true,
            userId: true,
            isEpic: true
        }
    });

    if (!m) {
        return NextResponse.json(
            { error: 'Not found' },
            { status: 404 }
        );
    }

    if (m.userId !== session.user.id) {
        return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
        );
    }

    if (m.isEpic) {
        return NextResponse.json(
            { ok: true, message: 'Already epic' }
        );
    }

    const form = await req.formData().catch(() => null);

    const reason =
        form?.get('reason')
            ?.toString()
            .trim() || '';

    const tagsRaw =
        form?.get('tags')
            ?.toString() || '';

    const tags = tagsRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 10);

    if (!reason) {
        return NextResponse.json(
            { error: 'Reason required' },
            { status: 400 }
        );
    }

    try {
        const app = await prisma.epicApplication.upsert({
            where: {
                userId_momentId: {
                    userId: session.user.id,
                    momentId: m.id
                }
            },
            update: {
                reason,
                tags,
                status: 'PENDING'
            },
            create: {
                userId: session.user.id,
                momentId: m.id,
                reason,
                tags,
                status: 'PENDING'
            }
        });

        return NextResponse.json(
            { ok: true, applicationId: app.id }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Failed to submit' },
            { status: 500 }
        );
    }
}
