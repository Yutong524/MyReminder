import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(req) {
    try {
        const secret = process.env.CRON_SECRET;
        if (secret) {
            const auth = req.headers.get('authorization') || '';
            if (!auth.startsWith('Bearer ') || auth.slice(7) !== secret) {
                return unauthorized();
            }
        }

        const now = new Date();
        const batchSize = Number(process.env.CRON_BATCH || 25);

        const due = await prisma.reminderJob.findMany({
            where: { status: 'PENDING', scheduledAt: { lte: now } },
            orderBy: { scheduledAt: 'asc' },
            take: batchSize,
            include: { moment: true, rule: true },
        });

        if (due.length === 0) {
            return NextResponse.json({ ok: true, processed: 0 });
        }

        let sent = 0, failed = 0;

        for (const job of due) {
            const queued = await prisma.reminderJob.update({
                where: { id: job.id },
                data: { status: 'QUEUED', attempts: { increment: 1 } },
            });

            try {
                const info = await sendEmail({
                    to: job.recipientEmail,
                    subject: job.subject,
                    text: job.body,
                });

                await prisma.reminderJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'SENT',
                        providerMessageId: info?.messageId || null,
                        sentAt: new Date(),
                        lastError: null,
                    },
                });

                await prisma.deliveryLog.create({
                    data: {
                        momentId: job.momentId,
                        jobId: job.id,
                        status: 'SENT',
                        message: `MessageID=${info?.messageId || 'n/a'}`,
                    },
                });

                sent++;
            } catch (err) {
                await prisma.reminderJob.update({
                    where: { id: job.id },
                    data: {
                        status: 'FAILED',
                        lastError: String(err?.message || err),
                    },
                });

                await prisma.deliveryLog.create({
                    data: {
                        momentId: job.momentId,
                        jobId: job.id,
                        status: 'FAILED',
                        message: String(err?.message || err),
                    },
                });

                failed++;
            }
        }

        return NextResponse.json({ ok: true, processed: due.length, sent, failed });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
    }
}
