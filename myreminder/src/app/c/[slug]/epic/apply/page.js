import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ApplyEpicPage({ params }) {
    const { slug } = params;

    const session = await getServerSession(authOptions);
    if (!session) {
        redirect(`/api/auth/signin?callbackUrl=/c/${slug}/epic/apply`);
    }

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: { id: true, title: true, userId: true, isEpic: true, epicTags: true }
    });
    if (!m) return notFound();
    if (m.userId !== session.user.id) redirect('/dashboard');

    const existing = await prisma.epicApplication.findUnique({
        where: { userId_momentId: { userId: session.user.id, momentId: m.id } }
    });

    const styles = {
        page: {
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            padding: 24,
            background:
                'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
            color: '#EAF2FF'
        },
        grid: {
            position: 'absolute',
            inset: 0,
            backgroundImage:
                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),' +
                ' linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px, 40px 40px',
            maskImage:
                'radial-gradient(ellipse at center,' +
                ' rgba(0,0,0,0.9) 0%,' +
                ' rgba(0,0,0,0.85) 40%,' +
                ' rgba(0,0,0,0) 75%)',
            pointerEvents: 'none'
        },
        rays: {
            position: 'absolute',
            inset: 0,
            background:
                'conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%),' +
                ' conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
        },
        shell: {
            width: '100%',
            maxWidth: 720,
            margin: '40px auto',
            position: 'relative'
        },
        card: {
            borderRadius: 20,
            background:
                'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow:
                '0 20px 60px rgba(0,0,0,0.45),' +
                ' inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: 22,
            backdropFilter: 'blur(10px)'
        },
        h1: {
            margin: 0,
            fontSize: 'clamp(24px, 4vw, 32px)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            backgroundImage:
                'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
        },
        sub: {
            marginTop: 6,
            color: '#B9C6DD',
            fontSize: 14
        },
        form: {
            display: 'grid',
            gap: 12,
            marginTop: 14
        },
        input: {
            width: '100%',
            padding: 10,
            borderRadius: 12,
            border: '1px solid rgba(127,179,255,0.25)',
            background:
                'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF',
            outline: 'none',
            fontSize: 14
        },
        ta: { minHeight: 120, resize: 'vertical' },
        btn: {
            justifySelf: 'start',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
                'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#fff',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow:
                '0 12px 24px rgba(13,99,229,0.30),' +
                ' inset 0 1px 0 rgba(255,255,255,0.20)'
        },
        notice: {
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(127,179,255,0.12)',
            border: '1px solid rgba(127,179,255,0.25)',
            color: '#DCEAFF',
            fontSize: 14
        }
    };

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />

            <div style={styles.shell}>
                <section style={styles.card}>
                    <h1 style={styles.h1}>Apply for Epic</h1>
                    <p style={styles.sub}>
                        You are applying for{' '}
                        <a
                            href={`/c/${slug}`}
                            style={{ color: '#7FB3FF', textDecoration: 'none' }}
                        >
                            {m.title}
                        </a>.
                    </p>

                    {m.isEpic && (
                        <div style={{ ...styles.notice, marginBottom: 12 }}>
                            This countdown has already been marked as Epic.
                        </div>
                    )}

                    {existing && !m.isEpic ? (
                        <div style={styles.notice}>
                            Application submitted — status: <b>{existing.status}</b>.
                            {existing.status === 'PENDING' &&
                                ' We will review your application soon.'}
                        </div>
                    ) : (
                        !m.isEpic && (
                            <form
                                action={`/api/moments/${slug}/epic/apply`}
                                method="post"
                                style={styles.form}
                            >
                                <label>
                                    Why is this countdown epic?
                                    <textarea
                                        name="reason"
                                        required
                                        placeholder="Tell us what makes it special, useful, or inspiring…"
                                        style={{ ...styles.input, ...styles.ta }}
                                    />
                                </label>
                                <label>
                                    Suggested categories (comma separated)
                                    <input
                                        name="tags"
                                        placeholder="e.g. product-launch, sports, birthday"
                                        style={styles.input}
                                    />
                                </label>
                                <button style={styles.btn}>Submit application</button>
                            </form>
                        )
                    )}
                </section>
            </div>
        </main>
    );
}
