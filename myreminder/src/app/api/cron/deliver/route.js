export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSlack } from '@/lib/channels/slack';
import { sendSMS } from '@/lib/channels/sms';

const BATCH = Number(process.env.CRON_BATCH || 25);

function authorized(req) {
    const t = req.headers.get('authorization') || '';
    const secret = process.env.CRON_SECRET;
    return secret ? t === `Bearer ${secret}` : true;
}

export async function POST(req) {
    if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const jobs = await prisma.reminderJob.findMany({
        where: { status: 'PENDING', scheduledAt: { lte: now } },
        orderBy: { scheduledAt: 'asc' },
        take: BATCH,
    });

    const results = [];
    for (const j of jobs) {
        try {
            await prisma.reminderJob.update({ where: { id: j.id }, data: { status: 'QUEUED', attempts: { increment: 1 } } });

            let providerId = null;
            if (j.channel === 'EMAIL') {
                const info = await sendEmail({ to: j.recipientEmail, subject: j.subject, text: j.body });
                providerId = info?.messageId || null;
            } else if (j.channel === 'SLACK') {
                const info = await sendSlack({ webhook: j.recipientSlackWebhook, text: j.body });
                providerId = info?.id || null;
            } else if (j.channel === 'SMS') {
                const info = await sendSMS({ to: j.recipientPhone, body: j.body });
                providerId = info?.id || null;
            }

            await prisma.reminderJob.update({
                where: { id: j.id },
                data: { status: 'SENT', providerMessageId: providerId, sentAt: new Date() },
            });
            await prisma.deliveryLog.create({
                data: { momentId: j.momentId, jobId: j.id, status: 'SENT', message: `ok:${j.channel}` },
            });

            results.push({ id: j.id, ok: true });
        } catch (e) {
            const msg = e?.message || 'send failed';
            await prisma.reminderJob.update({
                where: { id: j.id },
                data: { status: 'FAILED', lastError: msg },
            });
            await prisma.deliveryLog.create({
                data: { momentId: j.momentId, jobId: j.id, status: 'FAILED', message: msg },
            });
            results.push({ id: j.id, ok: false, error: msg });
        }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
}
