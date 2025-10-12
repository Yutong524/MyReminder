import { prisma } from "@/lib/prisma";
import { buildIdempotencyKey, nextAllowedSendTime } from "./quiet-hours";

async function loadQuietOptionsForUser(userId) {
    if (!userId) return {};
    const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
            quietStartMin: true, 
            quietEndMin: true, 
            quietDays: true 
        }
    });
    return {
        quietStartMin: u?.quietStartMin ?? null,
        quietEndMin: u?.quietEndMin ?? null,
        quietDays: u?.quietDays ?? []
    };
}

export async function createReminderJob({
    moment,
    rule,
    occurrenceUtc,
    recipient,
    subject,
    body
}) {
    const userId = moment.userId;
    const quietOpts = await loadQuietOptionsForUser(userId);

    const baseAt = new Date(occurrenceUtc);
    const scheduledAt = nextAllowedSendTime(baseAt, quietOpts);

    const idempotencyKey = buildIdempotencyKey({
        momentId: moment.id,
        channel: rule.channel,
        occurrenceUtc: baseAt
    });

    const job = await prisma.reminderJob.upsert({
        where: { idempotencyKey },
        create: {
            momentId: moment.id,
            ruleId: rule.id,
            scheduledAt,
            channel: rule.channel,
            recipientEmail: recipient?.email || null,
            recipientSlackWebhook: recipient?.slackWebhook || null,
            recipientDiscordWebhook: recipient?.discordWebhook || null,
            recipientPhone: recipient?.phone || null,
            subject,
            body,
            idempotencyKey
        },
        update: {
            scheduledAt
        },
        include: { moment: true, rule: true }
    });

    if (scheduledAt.getTime() !== baseAt.getTime()) {
        await prisma.deliveryLog.create({
            data: {
                momentId: moment.id,
                jobId: job.id,
                status: "QUEUED",
                message: "QUIET_HOURS_DELAYED"
            }
        });
    }

    return job;
}
