import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugifyTitle } from '@/lib/slug';
import { localToUtc } from '@/lib/time';

const THEMES = new Set(['default', 'birthday', 'exam', 'launch', 'night']);
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

function bad(msg, code = 400) {
    return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req) {
    try {
        const body = await req.json();
        const title = (body.title || '').trim();
        const localDateTime = (body.localDateTime || '').trim();
        const timeZone = (body.timeZone || '').trim();
        const visibility = body.visibility || 'PUBLIC';
        const theme = (body.theme || 'default').trim().toLowerCase();
        const safeTheme = THEMES.has(theme) ? theme : 'default';
        const email = (body.email || '').trim();
        const rules = body.rules || {};

        if (!title) return bad('Title is required');
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateTime)) {
            return bad("localDateTime must be 'YYYY-MM-DDTHH:mm'");
        }
        if (!timeZone) return bad('timeZone is required');

        const targetUtc = localToUtc(localDateTime, timeZone);
        if (targetUtc.getTime() < Date.now() + 60_000) {
            return bad('Target time must be at least 1 minute in the future');
        }

        let slug = slugifyTitle(title);
        for (let i = 0; i < 5; i++) {
            const exists = await prisma.moment.findUnique({ where: { slug } });
            if (!exists) break;
            slug = slugifyTitle(title);
        }

        const created = await prisma.moment.create({
            data: {
                title, slug, targetUtc, timeZone, visibility, theme: safeTheme,
                ownerEmail: email || null
            },
            select: { id: true, slug: true, title: true, targetUtc: true, timeZone: true, ownerEmail: true },
        });

        if (created.ownerEmail && (rules.seven || rules.three || rules.one || rules.dayOf)) {
            const offsets = [];
            if (rules.seven) offsets.push(-7 * 24 * 60);
            if (rules.three) offsets.push(-3 * 24 * 60);
            if (rules.one) offsets.push(-1 * 24 * 60);
            if (rules.dayOf) offsets.push(0);
            const ruleCreates = offsets.map((off) => ({ momentId: created.id, offsetMinutes: off, channel: 'EMAIL' }));
            const createdRules = await prisma.$transaction(
                ruleCreates.map(data => prisma.reminderRule.create({ data, select: { id: true, offsetMinutes: true } }))
            );

            const now = new Date();
            const jobsData = createdRules.flatMap((r) => {
                const scheduledAt = new Date(new Date(created.targetUtc).getTime() + r.offsetMinutes * 60000);
                if (scheduledAt.getTime() <= now.getTime()) return []; // 跳过已过期
                const link = `${BASE_URL}/c/${created.slug}`;
                const subject = `${created.title} — Reminder`;
                const body = [
                    `Event: ${created.title}`,
                    `When: ${new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: created.timeZone }).format(new Date(created.targetUtc))} (${created.timeZone})`,
                    `Link: ${link}`,
                    '',
                    `This reminder was scheduled ${r.offsetMinutes === 0 ? 'for the event time' : `${Math.abs(r.offsetMinutes)} minutes ${r.offsetMinutes < 0 ? 'before' : 'after'}`}.`
                ].join('\n');
                return [{
                    momentId: created.id,
                    ruleId: r.id,
                    scheduledAt,
                    status: 'PENDING',
                    attempts: 0,
                    recipientEmail: created.ownerEmail,
                    subject,
                    body
                }];
            });
            if (jobsData.length) {
                await prisma.reminderJob.createMany({ data: jobsData });
            }
        }

        return NextResponse.json({ ok: true, slug: created.slug, url: `/c/${created.slug}` });
    } catch (e) {
        console.error(e);
        return bad('Failed to create moment', 500);
    }
}
