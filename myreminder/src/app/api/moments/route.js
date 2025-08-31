import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugifyTitle } from '@/lib/slug';
import { localToUtc } from '@/lib/time';

const THEMES = new Set(['default', 'birthday', 'exam', 'launch', 'night']);

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
            data: { title, slug, targetUtc, timeZone, visibility, theme: safeTheme },
            select: { slug: true },
        });

        return NextResponse.json({ ok: true, slug: created.slug, url: `/c/${created.slug}` });
    } catch (e) {
        console.error(e);
        return bad('Failed to create moment', 500);
    }
}
