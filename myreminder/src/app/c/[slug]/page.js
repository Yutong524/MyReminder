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

    return (
        <div className={`theme-${m.theme} page-wrap`}>
            <main className="card">
                <ShareControls slug={slug} title={m.title} />
                <h1 className="title">{m.title}</h1>
                <p className="subtitle">Time left · {humanizeRemaining(m.targetUtc.toISOString())}</p>
                <Countdown targetIso={m.targetUtc.toISOString()} />
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
