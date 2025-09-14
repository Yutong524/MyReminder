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

export const dynamic = 'force-dynamic';

export default async function CountdownPage({ params }) {
    const { slug } = await params;

    const m = await prisma.moment.findUnique({
        where: { slug },
        select: {
            id: true, title: true, slug: true, targetUtc: true, timeZone: true, theme: true, visibility: true,
            bgImageUrl: true, bgSize: true, bgPosition: true, bgOpacity: true, bgBlend: true, bgFilters: true,
            titleColor: true, timeColor: true,

            bgmUrl: true, bgmLoop: true, bgmVolume: true,
            endSoundKey: true, endSoundUrl: true, endSoundVolume: true,

            cheerCount: true,
        }
    });
    if (!m) return notFound();

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
        shell: { maxWidth: 1120, margin: '40px auto', position: 'relative' },
        layout: {
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 340px',
            gap: 16
        },
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
        title: {
            margin: 0,
            fontSize: 'clamp(28px, 5vw, 44px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: m.titleColor || '#EAF2FF'
        },
        subtitle: { margin: '6px 0 12px', color: '#B9C6DD' },
        metaRow: { display: 'flex', gap: 8, alignItems: 'center', color: '#8FA5C6', fontSize: 14, marginBottom: 10 },
        bullet: { width: 4, height: 4, borderRadius: 99, background: '#7FB3FF', opacity: .7 },
        divider: { height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.14), rgba(255,255,255,0))', margin: '16px 0' },
        guestCard: {
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.10)',
            padding: 16,
            marginTop: 16
        },

        sec: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', marginBottom: 10, overflow: 'hidden' },
        secHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', userSelect: 'none' },
        secTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EAF2FF', fontWeight: 600 },
        secBody: { padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', color: '#C7D3E8', fontSize: 13 },
        tag: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }
    };

    const css = [
        '@media (max-width: 980px){ .layout{ grid-template-columns: 1fr; } .side{ position: static !important; } }',
        '.chev{ transition: transform 160ms ease; }',
        'details[open] .chev{ transform: rotate(90deg); }',
        '.pill{ transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease; }',
        '.pill:hover{ transform: translateY(-1px); box-shadow: 0 10px 20px rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.18); }'
    ].join('\n');

    return (
        <div className={`theme-${m.theme} page-wrap`} style={styles.page}>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />
            {bgLayer && <div aria-hidden style={{ position: 'absolute', inset: 0, ...bgLayer }} />}

            <AnalyticsTracker slug={slug} />

            <div style={styles.shell}>
                <div className="layout" style={styles.layout}>
                    {/* Main card — minimalist template-focused countdown */}
                    <main className="card" style={styles.mainCard}>
                        <div style={styles.metaRow}>
                            <span style={styles.tag} className="pill">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M12 5v14M5 12h14" stroke="#7FB3FF" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Countdown
                            </span>
                            <span style={styles.bullet} />
                            <span style={{ color: '#8FA5C6' }}>Time left · {humanizeRemaining(m.targetUtc.toISOString())}</span>
                        </div>

                        <h1 className="title" style={styles.title}>{m.title}</h1>

                        <div style={styles.subtitle}>
                            <span>Event time: {formatInIana(m.targetUtc.toISOString(), m.timeZone)} ({m.timeZone})</span>
                            <span style={{ marginLeft: 8, opacity: .9 }}>• Your local: {formatInLocal(m.targetUtc.toISOString())}</span>
                        </div>

                        <div style={styles.divider} />

                        <div style={{ display: 'grid', gap: 8 }}>
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

                        <div style={styles.guestCard}>
                            <CheerGuestbook slug={slug} initialCount={m.cheerCount} />
                        </div>
                    </main>

                    {/* Sidebar — advanced / supporting info */}
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

                        <details>
                            <summary style={styles.secHeader}>
                                <span style={styles.secTitle}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M6 18V6l12 6-12 6z" stroke="#7FB3FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Audio
                                </span>
                                <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M9 18l6-6-6-6" stroke="#C7D3E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </summary>
                            <div style={styles.secBody}>
                                <div style={{ display: 'grid', gap: 6 }}>
                                    <div><span style={styles.tag}>BGM</span> {m.bgmUrl ? 'Enabled' : 'None'}</div>
                                    {m.bgmUrl && <div style={{ opacity: .9 }}>Loop: {m.bgmLoop ? 'Yes' : 'No'} · Vol: {m.bgmVolume ?? 100}</div>}
                                    <div><span style={styles.tag}>End sound</span> {m.endSoundUrl || (m.endSoundKey && m.endSoundKey !== 'none') ? 'Enabled' : 'None'}</div>
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
                </div>
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
