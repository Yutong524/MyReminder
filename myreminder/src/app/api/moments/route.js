import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugifyTitle } from '@/lib/slug';
import { localToUtc } from '@/lib/time';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { rruleFromInput, nextOccurrenceUtc } from '@/lib/recurrence';

const THEMES = new Set(['default', 'birthday', 'exam', 'launch', 'night']);
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const BUILTIN_END_SOUNDS = new Set(['none', 'bell', 'chime', 'beep']);

function bad(msg, code = 400) {
    return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req) {
    try {
        const body = await req.json();

        let bgmUrl = (body.bgmUrl || '').trim() || null;
        const bgmLoop = body.bgmLoop !== false;
        const bgmVolume = Math.max(0, Math.min(100, Number(body.bgmVolume ?? 50)));
        const endSoundKey = (body.endSoundKey || '').trim().toLowerCase() || null;
        let endSoundUrl = (body.endSoundUrl || '').trim() || null;
        const endSoundVolume = Math.max(0, Math.min(100, Number(body.endSoundVolume ?? 80)));

        if (endSoundKey && !BUILTIN_END_SOUNDS.has(endSoundKey)) {
            return NextResponse.json({ error: 'Invalid end sound' }, { status: 400 });
        }
        if (endSoundKey && endSoundKey !== 'none') endSoundUrl = null;

        const title = (body.title || '').trim();
        const localDateTime = (body.localDateTime || '').trim();
        const timeZone = (body.timeZone || '').trim();
        const visibility = (body.visibility || 'PUBLIC').toUpperCase();
        const theme = (body.theme || 'default').trim().toLowerCase();
        const safeTheme = THEMES.has(theme) ? theme : 'default';
        const email = (body.email || '').trim();
        const rules = body.rules || {};
        const passcode = (body.passcode || '').trim();

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

        if (visibility === 'PRIVATE' && !passcode) {
            return bad('Passcode is required for PRIVATE moments');
        }
        let passcodeHash = null;
        if (visibility === 'PRIVATE' && passcode) {
            if (passcode.length < 4 || passcode.length > 64) return bad('Passcode length must be 4~64');
            passcodeHash = await bcrypt.hash(passcode, 10);
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || null;

        let rrule = null, rtime = null;
        if (body.recurrence) {
            const session = await getServerSession(authOptions);
            if (!session) return bad('Login required for recurring timers', 401);
            rrule = rruleFromInput(body.recurrence);
            rtime = (body.recurrence.time || (localDateTime.split('T')[1]))?.slice(0, 5) || null;
        }

        const created = await prisma.moment.create({
            data: {
                title, slug, targetUtc, timeZone, visibility, theme: safeTheme,
                ownerEmail: email || null,
                passcodeHash,
                userId,
                rrule,
                rtime,
                bgmUrl, bgmLoop, bgmVolume,
                endSoundKey, endSoundUrl, endSoundVolume
            },
            select: { id: true, slug: true, title: true, targetUtc: true, timeZone: true, ownerEmail: true },
        });

        if (created.rrule && created.rtime && created.targetUtc <= new Date()) {
            const next = nextOccurrenceUtc({ fromUtc: new Date(), rrule: created.rrule, rtime: created.rtime, timeZone });
            if (next) {
                await prisma.moment.update({ where: { id: created.id }, data: { targetUtc: next } });
            }
        }

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
                if (scheduledAt.getTime() <= now.getTime()) return []
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
