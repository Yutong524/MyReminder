import { prisma } from '@/lib/prisma';
import Countdown from './view-client';
import { notFound } from 'next/navigation';

export default async function CountdownPage({ params }) {
    const m = await prisma.moment.findUnique({ where: { slug: params.slug } });
    if (!m) return notFound();

    return (
        <main style={{ maxWidth: 680, margin: '40px auto', padding: 16 }}>
            <h1 style={{ marginBottom: 4 }}>{m.title}</h1>
            <p style={{ opacity: 0.7, marginBottom: 16 }}>
                Target (UTC): {m.targetUtc.toISOString()} | TZ: {m.timeZone}
            </p>
            <Countdown targetIso={m.targetUtc.toISOString()} />
        </main>
    );
}
