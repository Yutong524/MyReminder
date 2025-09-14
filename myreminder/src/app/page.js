export default function Home() {
    const styles = {
        page: {
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%), radial-gradient(1200px 600px at 20% -10%, rgba(13, 99, 229, 0.22) 0%, rgba(13, 99, 229, 0) 60%), radial-gradient(900px 500px at 110% 10%, rgba(255, 193, 7, 0.22) 0%, rgba(255, 193, 7, 0) 55%)',
            color: '#EAF2FF'
        },
        grid: {
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px, 40px 40px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)',
            pointerEvents: 'none'
        },
        rays: {
            position: 'absolute',
            inset: 0,
            background: 'conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
        },
        shell: {
            width: '100%',
            maxWidth: 560,
            margin: '40px auto',
            padding: 16
        },
        card: {
            position: 'relative',
            width: '100%',
            borderRadius: '20px',
            background: 'linear-gradient(180deg, rgba(13,16,31,0.75), rgba(12,14,24,0.75))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '28px',
            backdropFilter: 'blur(10px)'
        },
        badgeRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px'
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#0A0F1F',
            background: 'linear-gradient(90deg, #FFC107, #FFE082)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 20px rgba(255,193,7,0.28)'
        },
        h1: {
            margin: 0,
            fontSize: 'clamp(28px, 4.5vw, 40px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            backgroundImage: 'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 1px rgba(127,179,255,0.15)'
        },
        p: {
            marginTop: '10px',
            marginBottom: '18px',
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#B9C6DD'
        },
        ctaRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '6px'
        },
        ctaPrimary: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#FFFFFF',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)'
        },
        hint: {
            fontSize: '13px',
            color: '#88A0BF'
        },
        divider: {
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.14), rgba(255,255,255,0))',
            margin: '22px 0'
        },
        features: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px'
        },
        featureItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.08)'
        },
        iconWrap: {
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(180deg, rgba(13,99,229,0.18), rgba(13,99,229,0.05))',
            border: '1px solid rgba(127,179,255,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)'
        },
        featureText: {
            fontSize: '13px',
            lineHeight: 1.4,
            color: '#C7D3E8'
        }
    };

    const css = [
        '.ctaPrimary{ transition: transform 160ms ease, box-shadow 160ms ease; }',
        '.ctaPrimary:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }',
        '.ctaPrimary:active{ transform: translateY(0); box-shadow: 0 10px 18px rgba(13,99,229,0.30); }',
        '@media (max-width: 640px){ .features{ grid-template-columns: 1fr; } }'
    ].join('\n');

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden="true" />
            <div style={styles.rays} aria-hidden="true" />

            <div style={styles.shell}>
                <section style={styles.card}>

                    <h1 style={styles.h1}>MyReminder</h1>
                    <p style={styles.p}>Create and share a countdown in seconds.</p>

                    <div style={styles.ctaRow}>
                        <a href="/new" className="ctaPrimary" style={styles.ctaPrimary}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Create a Countdown →
                        </a>
                        <span style={styles.hint}>Precision timers. Shareable links. Zero friction.</span>
                    </div>

                    <div style={styles.divider} />

                    <div className="features" style={styles.features}>
                        <div style={styles.featureItem}>
                            <div style={styles.iconWrap}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="12" cy="12" r="7" stroke="#7FB3FF" strokeWidth="1.6" />
                                    <path d="M12 7v5l3 2" stroke="#7FB3FF" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span style={styles.featureText}>Sub-second accuracy</span>
                        </div>
                        <div style={styles.featureItem}>
                            <div style={styles.iconWrap}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M4 7h16M4 12h16M4 17h16" stroke="#7FB3FF" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span style={styles.featureText}>Clean, audit-ready logs</span>
                        </div>
                        <div style={styles.featureItem}>
                            <div style={styles.iconWrap}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.1 16.3l-2.8 2.8" stroke="#FFC107" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span style={styles.featureText}>Timezone smart links</span>
                        </div>
                    </div>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </main>
    );
}
