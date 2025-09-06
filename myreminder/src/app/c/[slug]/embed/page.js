import { prisma } from '@/lib/prisma';
import Countdown from '../view-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmbedPage({ params, searchParams }) {
    const { slug } = await params;
    const m = await prisma.moment.findUnique({
        where: { slug },
        select: { title: true, targetUtc: true, theme: true, visibility: true },
    });
    if (!m) return notFound();
    if (m.visibility === 'PRIVATE') {
        return (
            <div style={{ font: '14px system-ui', padding: 12, background: 'transparent' }}>
                Private countdown. Cannot be embedded.
            </div>
        );
    }

    const mode = (searchParams?.mode || 'full').toLowerCase(); // full|compact
    const theming = `theme-${searchParams?.theme || m.theme}`;

    return (
        <div className={`page-wrap ${theming}`} style={{ background: 'transparent', padding: 0 }}>
            <main className="card" style={{ margin: 0, padding: 12 }}>
                {mode !== 'compact' && <h2 className="title" style={{ fontSize: 18, margin: 0 }}>{m.title}</h2>}
                <Countdown targetIso={m.targetUtc.toISOString()} />
            </main>
        </div>
    );
}
