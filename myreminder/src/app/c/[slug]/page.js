import { prisma } from '@/lib/prisma';
import Countdown from './view-client';
import { notFound } from 'next/navigation';
import { humanizeRemaining, formatInIana, formatInLocal } from '@/lib/time';
import ShareControls from './share-client';
import { cookies } from 'next/headers';
import { cookieNameFor, verifyAccessToken } from '@/lib/access';
import AccessGateClient from './passcode-client';
import CheerGuestbook from './social-client';
import AnalyticsTracker from './analytics-client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import FollowButton from './follow-client';

export const dynamic = 'force-dynamic';

export default async function CountdownPage({ params }) {
    const { slug } = await params;

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            id: true, title: true, slug: true, targetUtc: true, timeZone: true, theme: true, visibility: true,
            bgImageUrl: true, bgSize: true, bgPosition: true, bgOpacity: true, bgBlend: true, bgFilters: true,
            titleColor: true, timeColor: true,
            userId: true,

            bgmUrl: true, bgmLoop: true, bgmVolume: true,
            endSoundKey: true, endSoundUrl: true, endSoundVolume: true,

            cheerCount: true,
        }
    });
    if (!m) return notFound();

    const session = await getServerSession(authOptions);
    let initialFollowed = false;
    if (session?.user?.id && m.userId !== session.user.id) {
        const f = await prisma.follow.findFirst({
            where: { userId: session.user.id, momentId: m.id },
            select: { id: true }
        });
        initialFollowed = !!f;
    }

    if (m.visibility === 'PRIVATE') {
        const token = cookies().get(cookieNameFor(slug))?.value;
        const allowed = verifyAccessToken(token, slug);
        if (!allowed) {
            const styles = {
                page: {
                    minHeight: '100vh',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
                    color: '#EAF2FF',
                    padding: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                card: {
                    width: '100%',
                    maxWidth: 560,
                    borderRadius: 20,
                    padding: 24,
                    background: 'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)'
                },
                h1: {
                    margin: 0,
                    fontSize: 'clamp(24px, 4vw, 32px)',
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    backgroundImage: 'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                },
                sub: { marginTop: 8, color: '#B9C6DD' }
            };
            return (
                <div className="page-wrap theme-default" style={styles.page}>
                    <main className="card" style={styles.card}>
                        <h1 className="title" style={styles.h1}>Private Countdown</h1>
                        <p className="subtitle" style={styles.sub}>This countdown is private. Enter passcode to view.</p>
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

    const bgLayer = m.bgImageUrl ? {
        backgroundImage: `url(${m.bgImageUrl})`,
        backgroundSize: m.bgSize || 'cover',
        backgroundPosition: m.bgPosition || 'center',
        backgroundRepeat: 'no-repeat',
        mixBlendMode: m.bgBlend || 'normal',
        filter: cssFilterFrom(m.bgFilters),
        opacity: (m.bgOpacity ?? 100) / 100,
    } : null;

    const styles = {
        page: {
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
            color: '#EAF2FF',
            padding: 24
        },
        grid: {
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px, 40px 40px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)',
            pointerEvents: 'none'
        },
        rays: {
            position: 'absolute', inset: 0,
            background: 'conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)',
            filter: 'blur(40px)', pointerEvents: 'none'
        },

        shell: { maxWidth: 1200, margin: '0 auto', position: 'relative' },

        hero: {
            minHeight: 'min(30vh, 30svh)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            justifyItems: 'center',
            alignItems: 'stretch',
            padding: 24,
            position: 'relative'
        },

        rowTop: { gridRow: 1, display: 'grid', gap: 10, justifyItems: 'center' },
        rowCenter: { gridRow: 2, display: 'grid', placeItems: 'center' },
        rowBottom: { gridRow: 3, display: 'grid', placeItems: 'center' },
        topChips: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
        followWrap: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginLeft: 8 },

        chip: {
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px',
            borderRadius: 999, border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            color: '#C7D3E8', fontSize: 14
        },
        title: {
            margin: 0,
            textAlign: 'center',
            fontSize: 'clamp(14px, 2vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: m.titleColor || '#EAF2FF',
            textShadow: '0 6px 24px rgba(0,0,0,0.45)'
        },
        timerWrap: {
            display: 'grid', placeItems: 'center', marginTop: 8, marginBottom: 8
        },
        infoChips: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },

        below: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16, margin: '24px 0 36px' },
        mainCard: {
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: 22,
            backdropFilter: 'blur(10px)'
        },
        sideCard: {
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
            padding: 16,
            height: 'fit-content',
            position: 'sticky',
            top: 16
        },
        sec: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', marginBottom: 10, overflow: 'hidden' },
        secHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', userSelect: 'none' },
        secTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EAF2FF', fontWeight: 600 },
        secBody: { padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', color: '#C7D3E8', fontSize: 13 },
        tag: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' },

        guestCard: {
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.10)',
            padding: 16
        }
    };

    const css = [
        '.hero-timer > *{ transform: scale(1.8); transform-origin: center; }',
        '@media (max-width: 980px){ .hero-timer > *{ transform: scale(1.25); } }',
        '@media (max-width: 980px){ .below{ grid-template-columns: 1fr; } .side{ position: static !important; } }',
        '.chev{ transition: transform 160ms ease; }',
        'details[open] .chev{ transform: rotate(90deg); }',
        '.chip{ transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease; }',
        '.chip:hover{ transform: translateY(-1px); box-shadow: 0 10px 20px rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.18); }'
    ].join('\n');

    const eventChip = (
        <span style={styles.chip} className="chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="#7FB3FF" strokeWidth="1.8" />
                <path d="M3 9h18" stroke="#7FB3FF" strokeWidth="1.8" />
                <path d="M8 3v4M16 3v4" stroke="#7FB3FF" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Event: {formatInIana(m.targetUtc.toISOString(), m.timeZone)} ({m.timeZone})
        </span>
    );

    const localChip = (
        <span style={styles.chip} className="chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" stroke="#FFC107" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="2.5" stroke="#FFC107" strokeWidth="1.8" />
            </svg>
            Your local: {formatInLocal(m.targetUtc.toISOString())}
        </span>
    );

    return (
        <div className={`theme-${m.theme} page-wrap`} style={styles.page}>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />
            {bgLayer && <div aria-hidden style={{ position: 'absolute', inset: 0, ...bgLayer }} />}

            <AnalyticsTracker slug={slug} />

            <div style={styles.shell}>
                <section style={styles.hero}>
                    <div style={styles.topChips}>
                        <span style={styles.chip} className="chip">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" stroke="#7FB3FF" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Countdown
                        </span>
                        <span style={styles.chip} className="chip">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" stroke="#C7D3E8" strokeWidth="1.8" />
                                <path d="M12 7v6l4 2" stroke="#C7D3E8" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            Time left · {humanizeRemaining(m.targetUtc.toISOString())}
                        </span>

                        {!!session && m.userId !== session.user.id && (
                            <span style={styles.followWrap}>
                                <FollowButton slug={slug} initialFollowed={initialFollowed} />
                            </span>
                        )}
                        {!session && (
                            <a href={`/signin?callbackUrl=/c/${slug}`} style={{ textDecoration: 'none' }}>
                                <span style={styles.chip} className="chip">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M12 5v14M5 12h14" stroke="#7FB3FF" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    Sign in to follow
                                </span>
                            </a>
                        )}

                    </div>

                    <h1 style={styles.title}>{m.title}</h1>

                    <div className="hero-timer" style={{ ...styles.timerWrap }}>
                        <Countdown
                            targetIso={m.targetUtc.toISOString()}
                            audio={{
                                bgmUrl: m.bgmUrl || null,
                                bgmLoop: m.bgmLoop,
                                bgmVolume: m.bgmVolume,
                                endUrl: m.endSoundUrl || (m.endSoundKey && m.endSoundKey !== 'none' ? `/sounds/${m.endSoundKey}.mp3` : null),
                                endVolume: m.endSoundVolume
                            }}
                        />
                    </div>

                    <div style={styles.infoChips}>
                        {eventChip}
                        {localChip}
                    </div>
                </section>

                <section className="below" style={styles.below}>
                    <div style={styles.mainCard}>
                        <details open>
                            <summary style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', color: '#EAF2FF', fontWeight: 600 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" stroke="#7FB3FF" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Guestbook & Cheers
                                <span style={{ color: '#8FA5C6', fontWeight: 400 }}>— keep it friendly</span>
                            </summary>
                            <div style={{ paddingTop: 12 }}>
                                <div style={styles.guestCard}>
                                    <CheerGuestbook slug={slug} initialCount={m.cheerCount} />
                                </div>
                            </div>
                        </details>
                    </div>

                    <aside className="side" style={styles.sideCard}>
                        <details open>
                            <summary style={styles.secHeader}>
                                <span style={styles.secTitle}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M4 12h16M12 4v16" stroke="#FFC107" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                    Share
                                </span>
                                <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M9 18l6-6-6-6" stroke="#C7D3E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </summary>
                            <div style={styles.secBody}>
                                <ShareControls slug={slug} title={m.title} theme={m.theme} />
                            </div>
                        </details>

                        <details>
                            <summary style={styles.secHeader}>
                                <span style={styles.secTitle}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <circle cx="12" cy="12" r="7" stroke="#7FB3FF" strokeWidth="1.6" />
                                    </svg>
                                    Details
                                </span>
                                <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M9 18l6-6-6-6" stroke="#C7D3E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </summary>
                            <div style={styles.secBody}>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <div><span style={styles.tag}>Slug</span> <code style={{ opacity: .9 }}>/c/{m.slug}</code></div>
                                    <div><span style={styles.tag}>Theme</span> <span style={{ opacity: .9 }}>{m.theme}</span></div>
                                    <div><span style={styles.tag}>Timezone</span> <span style={{ opacity: .9 }}>{m.timeZone}</span></div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={styles.tag}>Colors</span>
                                        <span style={{ width: 12, height: 12, borderRadius: 3, background: m.titleColor || '#EAF2FF' }} />
                                        <span style={{ width: 12, height: 12, borderRadius: 3, background: m.timeColor || '#EAF2FF' }} />
                                    </div>
                                </div>
                            </div>
                        </details>

                        {logs.length > 0 && (
                            <details>
                                <summary style={styles.secHeader}>
                                    <span style={styles.secTitle}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="M4 7h16M4 12h16M4 17h16" stroke="#FFC107" strokeWidth="1.6" strokeLinecap="round" />
                                        </svg>
                                        Recent deliveries
                                    </span>
                                    <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M9 18l6-6-6-6" stroke="#C7D3E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </summary>
                                <div style={styles.secBody}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {logs.map((l) => (
                                            <li key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                <code style={{ opacity: .8 }}>{l.status}</code>
                                                <span style={{ opacity: .8 }}>{new Date(l.createdAt).toLocaleString()}</span>
                                                <span style={{ opacity: .8, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.message || ''}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        )}
                    </aside>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </div>
    );
}

export async function generateMetadata({ params }) {
    const { slug } = await params;

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            title: true, targetUtc: true, theme: true, visibility: true,
            cheerCount: true,
            bgmUrl: true, bgmLoop: true, bgmVolume: true,
            endSoundKey: true, endSoundUrl: true, endSoundVolume: true
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

function cssFilterFrom(filters) {
    if (!filters) return '';
    const {
        blur = 0, brightness = 100, contrast = 100,
        grayscale = 0, sepia = 0
    } = filters || {};

    const parts = [];
    if (blur) parts.push(`blur(${blur}px)`);
    if (brightness !== 100) parts.push(`brightness(${brightness}%)`);
    if (contrast !== 100) parts.push(`contrast(${contrast}%)`);
    if (grayscale) parts.push(`grayscale(${grayscale}%)`);
    if (sepia) parts.push(`sepia(${sepia}%)`);

    return parts.join(' ');
}
