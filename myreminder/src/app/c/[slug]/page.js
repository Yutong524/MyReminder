import { prisma } from '@/lib/prisma';
import Countdown from './view-client';
import { notFound } from 'next/navigation';
import { humanizeRemaining } from '@/lib/time';
import ShareControls from './share-client';

export const dynamic = 'force-dynamic';

export default async function CountdownPage({ params }) {
    const { slug } = await params;

    const m = await prisma.moment.findUnique({ where: { slug } });
    if (!m) return notFound();

    const logs = await prisma.deliveryLog.findMany({
        where: { momentId: m.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return (
        <div className={`theme-${m.theme} page-wrap`}>
            <main className="card">
                <ShareControls slug={slug} title={m.title} />
                <h1 className="title">{m.title}</h1>
                <p className="subtitle">Time left · {humanizeRemaining(m.targetUtc.toISOString())}</p>
                <Countdown targetIso={m.targetUtc.toISOString()} />

                {logs.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                        <h3 style={{ margin: '12px 0 8px 0' }}>Recent deliveries</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: .9 }}>
                            {logs.map((l) => (
                                <li key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <code style={{ opacity: .8 }}>{l.status}</code>
                                    <span style={{ opacity: .8 }}>{new Date(l.createdAt).toLocaleString()}</span>
                                    <span style={{ opacity: .8 }}>{l.message || ''}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}

export async function generateMetadata({ params }) {
    const { slug } = await params;

    const m = await prisma.moment.findUnique({ where: { slug } });
    if (!m) return {};

    const left = humanizeRemaining(m.targetUtc.toISOString());
    const title = `${m.title} — Countdown`;
    const description =
        left === 'started' ? `${m.title} has started.` : `${left} until ${m.title}.`;
    const ogImage = `/c/${slug}/opengraph-image`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [ogImage],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}
