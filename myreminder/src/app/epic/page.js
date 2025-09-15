'use client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function EpicPage({ searchParams }) {
    const { q = '', cat } = await searchParams || {};
    const cats = Array.isArray(cat) ? cat : (cat ? [cat] : []);

    const moments = await prisma.moment.findMany({
        where: {
            isEpic: true,
            AND: [
                q ? { title: { contains: q, mode: 'insensitive' } } : {},
                cats.length ? { epicTags: { hasSome: cats } } : {}
            ]
        },
        select: {
            id: true, title: true, slug: true, epicTags: true, epicFeaturedAt: true,
            views: true, uniques: true, cheerCount: true, theme: true
        },
        orderBy: [
            { epicFeaturedAt: 'desc' },
            { views: 'desc' },
            { createdAt: 'desc' }
        ],
        take: 200
    });

    const tagSet = new Set();
    moments.forEach(m => (m.epicTags || []).forEach(t => tagSet.add(t)));
    const allTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));

    const styles = {
        page: {
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            padding: 24,
            background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
            color: '#EAF2FF'
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
        shell: { width: '100%', maxWidth: 1000, margin: '40px auto', position: 'relative' },
        headCard: {
            borderRadius: 20,
            background: 'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: 22,
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
        sub: { marginTop: 6, color: '#B9C6DD', fontSize: 14 },
        tools: { display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 14 },
        searchRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
        input: {
            flex: 1, minWidth: 220, padding: '10px 12px', borderRadius: 12,
            border: '1px solid rgba(127,179,255,0.25)',
            background: 'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF', outline: 'none', fontSize: 14
        },
        btn: {
            padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)', color: '#fff',
            fontWeight: 600, letterSpacing: '0.01em',
            boxShadow: '0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)'
        },
        tagRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
        tag: {
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            color: '#C7D3E8', fontSize: 13
        },
        tagActive: { borderColor: 'rgba(127,179,255,0.6)', boxShadow: '0 0 0 3px rgba(127,179,255,0.25)' },
        listCard: {
            marginTop: 16, borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.35)', overflow: 'hidden'
        },
        row: {
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-between', gap: 12
        },
        left: { display: 'grid', gap: 4 },
        titleLink: { textDecoration: 'none', color: '#EAF2FF', fontWeight: 600, letterSpacing: '0.01em' },
        meta: { fontSize: 12, color: '#8FA5C6' },
        badge: {
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px',
            borderRadius: 999, border: '1px solid rgba(255,255,255,0.10)',
            marginRight: 6,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
        },
        right: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
        ghost: {
            textDecoration: 'none', borderRadius: 10, padding: '8px 10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            color: '#C7D3E8', fontSize: 13
        },
        empty: { padding: '24px', color: '#B9C6DD', textAlign: 'center' }
    };

    const css = [
        '.tag{ transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease; }',
        '.tag:hover{ transform: translateY(-1px); box-shadow: 0 10px 20px rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.18); }',
        '.row:hover{ background: rgba(255,255,255,0.02); }',
        '@media (max-width: 760px){ .row{ flex-direction: column; align-items: flex-start; } }'
    ].join('\n');

    function linkWith(next) {
        const usp = new URLSearchParams();
        if (q) usp.set('q', q);
        cats.forEach(c => usp.append('cat', c));
        Object.entries(next).forEach(([k, v]) => {
            if (v == null) return;
            if (k === 'cat' && Array.isArray(v)) {
                // override cats
                usp.delete('cat');
                v.forEach(x => usp.append('cat', x));
            } else if (k === 'q') {
                v ? usp.set('q', v) : usp.delete('q');
            }
        });
        const s = usp.toString();
        return s ? `/epic?${s}` : '/epic';
    }

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />

            <div style={styles.shell}>
                <section style={styles.headCard}>
                    <h1 style={styles.h1}>Epic Countdowns</h1>
                    <p style={styles.sub}>A curated list of exceptional countdowns. Search by name and filter by category.</p>

                    <div style={styles.tools}>
                        <form action="/epic" method="get" style={styles.searchRow}>
                            <input name="q" defaultValue={q} placeholder="Search by name…" style={styles.input} />
                            {cats.map((c, i) => <input key={i} type="hidden" name="cat" value={c} />)}
                            <button style={styles.btn}>Search</button>
                        </form>

                        <div style={styles.tagRow}>
                            {allTags.length === 0 && <span style={{ color: '#8FA5C6', fontSize: 13 }}>No categories yet.</span>}
                            {allTags.map(tag => {
                                const active = cats.includes(tag);
                                const nextCats = active ? cats.filter(c => c !== tag) : [...cats, tag];
                                return (
                                    <a key={tag} href={linkWith({ cat: nextCats })}
                                        className="tag"
                                        style={{ ...styles.tag, ...(active ? styles.tagActive : {}) }}>
                                        {active ? '✓ ' : ''}{tag}
                                    </a>
                                );
                            })}
                            {cats.length > 0 && (
                                <a href={linkWith({ cat: [] })} className="tag" style={styles.tag}>Clear categories</a>
                            )}
                        </div>
                    </div>
                </section>

                <section style={styles.listCard}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {moments.map(m => (
                            <li key={m.id} className="row" style={styles.row}>
                                <div style={styles.left}>
                                    <a href={`/c/${m.slug}`} style={styles.titleLink}>{m.title}</a>
                                    <div style={styles.meta}>
                                        <span style={styles.badge}>/c/{m.slug}</span>
                                        <span style={styles.badge}>Views {m.views ?? 0} · Uniques {m.uniques ?? 0} · 🎉 {m.cheerCount ?? 0}</span>
                                        {(m.epicTags || []).map(t => <span key={t} style={styles.badge}>{t}</span>)}
                                        {m.epicFeaturedAt && <span style={styles.badge}>Featured {new Date(m.epicFeaturedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div style={styles.right}>
                                    <a href={`/c/${m.slug}`} style={styles.ghost}>Open</a>
                                </div>
                            </li>
                        ))}
                        {moments.length === 0 && (
                            <li style={styles.empty}>No epic countdowns found. Try adjusting your search or filters.</li>
                        )}
                    </ul>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </main>
    );
}
