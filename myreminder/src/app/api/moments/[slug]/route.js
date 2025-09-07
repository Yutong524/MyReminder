import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { localToUtc } from '@/lib/time';
import bcrypt from 'bcryptjs';
import { rruleFromInput, nextOccurrenceUtc } from '@/lib/recurrence';

export const runtime = 'nodejs';

function bad(msg, code = 400) { return NextResponse.json({ error: msg }, { status: code }); }

export async function PATCH(req, { params }) {
    try {
        const { slug } = await params;
        const session = await getServerSession(authOptions);
        if (!session) return bad('Unauthorized', 401);

        const m = await prisma.moment.findUnique({
            where: { slug },
            include: { rules: true }
        });
        if (!m) return bad('Not found', 404);
        if (m.userId !== session.user.id) return bad('Forbidden', 403);

        const body = await req.json();
        const title = (body.title || '').trim();
        const localDateTime = (body.localDateTime || '').trim();
        const timeZone = (body.timeZone || '').trim();
        const theme = (body.theme || 'default').trim();
        const visibility = (body.visibility || 'PUBLIC').toUpperCase();
        const email = (body.email || '').trim();
        const slackWebhookUrl = (body.slackWebhookUrl || '').trim() || null;
        const smsPhone = (body.smsPhone || '').trim() || null;
        const discordWebhookUrl = (body.discordWebhookUrl || "").trim() || null;
        const passcode = (body.passcode || '').trim();
        const rules = body.rules || {};

        const bgmUrl = (body.bgmUrl || '').trim() || null;
        const bgmLoop = body.bgmLoop !== false;
        const bgmVolume = Math.max(0, Math.min(100, Number(body.bgmVolume ?? 50)));
        const endSoundKey = (body.endSoundKey || '').trim().toLowerCase() || null;
        const endSoundUrl = (body.endSoundUrl || '').trim() || null;
        const endSoundVolume = Math.max(0, Math.min(100, Number(body.endSoundVolume ?? 80)));

        const notifyOnCheer = body.notifyOnCheer === true;
        const notifyOnNote = body.notifyOnNote === true;
        const recurrence = body.recurrence || null;
        const regenerateJobs = Boolean(body.regenerateJobs);

        if (!title) return bad('Title is required');
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateTime)) return bad("localDateTime must be 'YYYY-MM-DDTHH:mm'");
        if (!timeZone) return bad('timeZone is required');

        const targetUtc = localToUtc(localDateTime, timeZone);

        let passcodeHash = m.passcodeHash;
        if (visibility === 'PRIVATE' && passcode) {
            if (passcode.length < 4 || passcode.length > 64) return bad('Passcode length must be 4–64');
            passcodeHash = await bcrypt.hash(passcode, 10);
        }
        if (visibility !== 'PRIVATE') passcodeHash = null;

        let dataToUpdate = {
            where: { id: m.id },
            data: {
                title, targetUtc, timeZone, theme, visibility,
                ownerEmail: email || null,
                slackWebhookUrl,
                smsPhone,
                discordWebhookUrl,
                passcodeHash,
                notifyOnCheer,
                notifyOnNote,
                bgmUrl, bgmLoop, bgmVolume,
                endSoundKey,
                endSoundUrl: endSoundKey && endSoundKey !== 'none' ? null : endSoundUrl,
                endSoundVolume,
            }
        };

        if (recurrence) {
            const rrule = rruleFromInput(recurrence);
            const rtime = (recurrence.time || localDateTime.split('T')[1])?.slice(0, 5) || null;
            dataToUpdate.data.rrule = rrule;
            dataToUpdate.data.rtime = rtime;
            if (rrule && rtime) {
                const next = nextOccurrenceUtc({ fromUtc: new Date(), rrule, rtime, timeZone });
                if (next) dataToUpdate.data.targetUtc = next;
            } else {
                dataToUpdate.data.rrule = null;
                dataToUpdate.data.rtime = null;
                dataToUpdate.data.currentStreak = 0;
            }
        }

        const updated = await prisma.moment.update({
            ...dataToUpdate,
            select: { id: true, slug: true, targetUtc: true, timeZone: true, rrule: true, rtime: true }
        });

        const wantedOffsets = new Set([
            rules.seven ? -7 * 24 * 60 : null,
            rules.three ? -3 * 24 * 60 : null,
            rules.one ? -1 * 24 * 60 : null,
            rules.dayOf ? 0 : null,
        ].filter(v => v !== null));

        for (const off of wantedOffsets) {
            const exist = await prisma.reminderRule.findFirst({
                where: { momentId: m.id, channel: 'EMAIL', offsetMinutes: off }
            });
            if (exist) {
                if (!exist.active) await prisma.reminderRule.update({ where: { id: exist.id }, data: { active: true } });
            } else {
                await prisma.reminderRule.create({
                    data: { momentId: m.id, channel: 'EMAIL', offsetMinutes: off, active: true }
                });
            }
        }
        await prisma.reminderRule.updateMany({
            where: { momentId: m.id, channel: 'EMAIL', NOT: { offsetMinutes: { in: [...wantedOffsets] } } },
            data: { active: false }
        });

        if (regenerateJobs) {
            await prisma.reminderJob.deleteMany({
                where: { momentId: m.id, status: { in: ['PENDING', 'QUEUED', 'FAILED'] } }
            });

            const activeRules = await prisma.reminderRule.findMany({
                where: { momentId: m.id, channel: 'EMAIL', active: true },
                select: { id: true, offsetMinutes: true }
            });
            const now = new Date();

            const jobs = [];
            for (const r of activeRules) {
                const scheduledAt = new Date(updated.targetUtc.getTime() + r.offsetMinutes * 60000);
                if (scheduledAt <= now) continue;
                const subject = `${title} — Reminder`;
                const link = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '') + `/c/${updated.slug}`;
                const bodyText = [
                    `Event: ${title}`,
                    `When: ${updated.targetUtc.toISOString()} (UTC)`,
                    `Link: ${link}`
                ].join('\n');

                if (email) {
                    jobs.push({
                        momentId: m.id,
                        ruleId: r.id,
                        scheduledAt,
                        status: 'PENDING',
                        attempts: 0,
                        recipientEmail: email,
                        subject,
                        body: bodyText
                    });
                }
            }
            if (jobs.length) await prisma.reminderJob.createMany({ data: jobs });
        }

        return NextResponse.json({ ok: true, slug: updated.slug, url: `/c/${updated.slug}` });
    } catch (e) {
        console.error(e);
        return bad('Update failed', 500);
    }
}
