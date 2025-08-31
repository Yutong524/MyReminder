import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import EditForm from './edit-client';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }) {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    if (!session) redirect(`/api/auth/signin?callbackUrl=/c/${slug}/edit`);

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            id: true, userId: true, title: true, slug: true, targetUtc: true, timeZone: true,
            theme: true, visibility: true, ownerEmail: true,
            rules: { where: { active: true }, select: { offsetMinutes: true } }
        }
    });
    if (!m) return notFound();
    if (m.userId !== session.user.id) redirect('/dashboard');     

    const initial = {
        title: m.title,
        timeZone: m.timeZone,
        theme: m.theme,
        visibility: m.visibility,
        email: m.ownerEmail || '',
        localDate: new Date(m.targetUtc).toISOString().slice(0, 10),
        localTime: new Date(m.targetUtc).toISOString().slice(11, 16),
        rules: {
            seven: m.rules.some(r => r.offsetMinutes === -7 * 24 * 60),
            three: m.rules.some(r => r.offsetMinutes === -3 * 24 * 60),
            one: m.rules.some(r => r.offsetMinutes === -1 * 24 * 60),
            dayOf: m.rules.some(r => r.offsetMinutes === 0),
        }
    };

    return (
        <main style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
            <h1>Edit Countdown</h1>
            <EditForm slug={slug} initial={initial} />
        </main>
    );
}
