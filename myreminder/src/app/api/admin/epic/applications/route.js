import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admins';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const q = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 20)));

    const where = {
        status,
        ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
        ...(q
            ? {
                OR: [
                    { moment: { title: { contains: q, mode: 'insensitive' } } },
                    { moment: { slug: { contains: q, mode: 'insensitive' } } },
                    { applicant: { email: { contains: q, mode: 'insensitive' } } },
                ],
            }
            : {}),
    };

    const [total, items] = await Promise.all([
        prisma.epicApplication.count({ where }),
        prisma.epicApplication.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                status: true,
                category: true,
                note: true,
                createdAt: true,
                reason: true,
                decidedAt: true,
                moment: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        isEpic: true,
                        epicCategory: true,
                        visibility: true,
                        views: true,
                        cheerCount: true
                    }
                },
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
            },
        }),
    ]);

    return NextResponse.json({ total, page, pageSize, items });
}
