import { prisma } from '@/lib/prisma';
import Countdown from './view-client';
import { notFound } from 'next/navigation';
import { humanizeRemaining, formatInIana, formatInLocal } from '@/lib/time';
import ShareControls from './share-client';
import { cookies } from 'next/headers';
import { cookieNameFor, verifyAccessToken } from '@/lib/access';
import AccessGateClient from './passcode-client';
import CheerGuestbook from './social-client';

export const dynamic = 'force-dynamic';

export default async function CountdownPage({ params }) {
    const { slug } = await params;

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            id: true, title: true, slug: true, targetUtc: true, timeZone: true, theme: true, visibility: true
        }
    });
    if (!m) return notFound();

    if (m.visibility === 'PRIVATE') {
        const token = cookies().get(cookieNameFor(slug))?.value;
        const allowed = verifyAccessToken(token, slug);
        if (!allowed) {

            return (
                <div className="page-wrap theme-default">
                    <main className="card">
                        <h1 className="title">Private Countdown</h1>
                        <p className="subtitle">This countdown is private. Enter passcode to view.</p>
                        <AccessGate slug={slug} />
                    </main>
                </div>
            );
        }
    }

    const logs = await prisma.deliveryLog.findMany({
        where: { momentId: m.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return (
        <div className={`theme-${m.theme} page-wrap`}>
            <main className="card">
                <ShareControls slug={slug} title={m.title} theme={m.theme} />
                <h1 className="title">{m.title}</h1>
                <p className="subtitle">
                    Time left · {humanizeRemaining(m.targetUtc.toISOString())}
                </p>
                <p style={{ opacity: .85, marginTop: 6, marginBottom: 16 }}>
                    Event time: {formatInIana(m.targetUtc.toISOString(), m.timeZone)} ({m.timeZone}) ·
                    <span style={{ marginLeft: 6 }}>Your local: {formatInLocal(m.targetUtc.toISOString())}</span>
                </p>
                <Countdown targetIso={m.targetUtc.toISOString()} />
                <CheerGuestbook
                    slug={slug}
                    initialCount={m.cheerCount}
                />

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

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            title: true, targetUtc: true, theme: true, visibility: true,
            cheerCount: true
        }
    });
    if (!m) return {};

    if (m.visibility === 'PRIVATE') {
        return {
            title: 'Private Countdown',
            description: 'This countdown is private.',
            robots: { index: false, follow: false, nocache: true },
        };
    }
    const left = humanizeRemaining(m.targetUtc.toISOString());
    const title = `${m.title} — Countdown`;
    const description = left === 'started' ? `${m.title} has started.` : `${left} until ${m.title}.`;
    const ogImage = `/c/${slug}/opengraph-image`;
    const robots = m.visibility === 'UNLISTED' ? { index: false, follow: false } : undefined;
    return {
        title, description, robots,
        openGraph: {
            title,
            description,
            images: [ogImage],
            type: 'website'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

function AccessGate({ slug }) {
    return <AccessGateClient slug={slug} />;
}
