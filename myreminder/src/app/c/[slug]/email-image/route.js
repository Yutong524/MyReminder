export const dynamic = 'force-dynamic';

import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { humanizeRemaining } from '@/lib/time';

const themeMap = {
    default: { bg: '#0f172a', fg: '#e2e8f0', acc: '#60a5fa' },
    birthday: { bg: '#8b5cf6', fg: '#fff7ed', acc: '#f59e0b' },
    exam: { bg: '#0ea5e9', fg: '#f8fafc', acc: '#022c22' },
    launch: { bg: '#111827', fg: '#f3f4f6', acc: '#10b981' },
    night: { bg: '#0b1021', fg: '#d1d5db', acc: '#a78bfa' },
};

export async function GET(req, { params }) {
    const { slug } = await params;
    const m = await prisma.moment.findUnique({
        where: { slug },
        select: { title: true, targetUtc: true, theme: true, visibility: true },
    });

    const t = themeMap[m?.theme || 'default'];

    if (!m || m.visibility === 'PRIVATE') {
        return new ImageResponse(
            (
                <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: t.bg, color: t.fg, fontFamily: 'system-ui, ui-sans-serif', fontSize: 28
                }}>
                    Private Countdown
                </div>
            ),
            { width: 600, height: 220 }
        );
    }

    const left = humanizeRemaining(m.targetUtc.toISOString());
    const title = m.title;

    return new ImageResponse(
        (
            <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${t.bg} 0%, #000 100%)`,
                color: t.fg, fontFamily: 'system-ui, ui-sans-serif'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 540 }}>
                    <div style={{ fontSize: 18, opacity: .9 }}>MyReminder</div>
                    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
                    <div style={{ fontSize: 20, color: t.acc }}>
                        {left === 'started' ? 'It has started.' : `${left} left`}
                    </div>
                    <div style={{ fontSize: 14, opacity: .8 }}>Open to see the live countdown →</div>
                </div>
            </div>
        ),
        { width: 600, height: 220 }
    );
}
