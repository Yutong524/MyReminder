export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nextOccurrenceUtc } from '@/lib/recurrence';

export async function POST(req, { params }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );

    const m = await prisma.moment.findUnique({
        where: { slug },
        include: {
            rules: {
                where: {
                    active: true,
                    channel: 'EMAIL'
                }
            }
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
    if (!m.rrule || !m.rtime) return NextResponse.json(
        { error: 'Not recurring' },
        { status: 400 }
    );
    const next = nextOccurrenceUtc({
        fromUtc: new Date(),
        rrule: m.rrule,
        rtime: m.rtime,
        timeZone: m.timeZone
    });
    if (!next) return NextResponse.json(
        { error: 'Cannot compute next' },
        { status: 400 }
    );

    const currentStreak = (m.currentStreak || 0) + 1;
    const maxStreak = Math.max(currentStreak, m.maxStreak || 0);
    await prisma.moment.update({
        where: { id: m.id },
        data: {
            targetUtc: next,
            currentStreak, maxStreak
        }
    });

    await prisma.reminderJob.deleteMany({ where: { momentId: m.id, status: { in: ['PENDING', 'QUEUED', 'FAILED'] } } });
    if (m.ownerEmail) {
        const jobs = [];
        for (const r of m.rules) {
            const scheduledAt = new Date(next.getTime() + r.offsetMinutes * 60000);
            const subject = `${m.title} — Reminder`;
            const link = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '') + `/c/${m.slug}`;
            const body = `Event: ${m.title}\nWhen: ${next.toISOString()} (UTC)\nLink: ${link}`;
            jobs.push({
                momentId: m.id,
                ruleId: r.id,
                scheduledAt,
                status: 'PENDING',
                attempts: 0,
                recipientEmail: m.ownerEmail,
                subject,
                body
            });
        }
        if (jobs.length) await prisma.reminderJob.createMany({ data: jobs });
    }
    return NextResponse.json({ ok: true, next });
}
