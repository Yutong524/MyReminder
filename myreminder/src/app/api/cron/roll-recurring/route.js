export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextOccurrenceUtc } from '@/lib/recurrence';

function authOk(req) {
    const token = req.headers.get('x-cron-secret') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    return token && process.env.CRON_SECRET && token === process.env.CRON_SECRET;
}

export async function GET(req) {
    if (!authOk(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const now = new Date();
    const list = await prisma.moment.findMany({
        where: { rrule: { not: null }, targetUtc: { lte: now } },
        include: { rules: { where: { active: true, channel: 'EMAIL' } } }
    });
    let processed = 0;
    for (const m of list) {
        const occ = m.targetUtc;
        const skip = await prisma.recurrenceSkip.findFirst({ where: { momentId: m.id, occurrenceUtc: occ } });

        const next = nextOccurrenceUtc({ fromUtc: new Date(occ.getTime() + 1000), rrule: m.rrule, rtime: m.rtime, timeZone: m.timeZone });
        if (!next) continue;
        let currentStreak = m.currentStreak;
        let maxStreak = m.maxStreak;
        if (skip) currentStreak = 0; else currentStreak = (currentStreak || 0) + 1;
        if (currentStreak > (maxStreak || 0)) maxStreak = currentStreak;

        await prisma.moment.update({
            where: { id: m.id },
            data: { targetUtc: next, currentStreak, maxStreak }
        });

        await prisma.reminderJob.deleteMany({ where: { momentId: m.id, status: { in: ['PENDING', 'QUEUED', 'FAILED'] } } });
        if (m.ownerEmail) {
            const jobs = [];
            for (const r of m.rules) {
                const scheduledAt = new Date(next.getTime() + r.offsetMinutes * 60000);
                if (scheduledAt <= now) continue;
                const subject = `${m.title} — Reminder`;
                const link = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '') + `/c/${m.slug}`;
                const body = `Event: ${m.title}\nWhen: ${next.toISOString()} (UTC)\nLink: ${link}`;
                jobs.push({
                    momentId: m.id, ruleId: r.id, scheduledAt,
                    status: 'PENDING', attempts: 0,
                    recipientEmail: m.ownerEmail, subject, body
                });
            }
            if (jobs.length) await prisma.reminderJob.createMany({ data: jobs });
        }
        processed++;
    }
    return NextResponse.json({ ok: true, processed });
}
