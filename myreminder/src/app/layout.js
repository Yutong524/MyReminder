import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: 'MyReminder',
  description: 'Create and share a countdown in seconds.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { type: 'website', siteName: 'MyReminder' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  const styles = {
    body: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
      color: '#EAF2FF'
    },
    headerWrap: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      background: 'linear-gradient(180deg, rgba(9,12,22,0.72), rgba(6,8,15,0.55))',
      borderBottom: '1px solid rgba(255,255,255,0.08)'
    },
    glow: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(700px 220px at 0% 0%, rgba(13,99,229,0.28), rgba(13,99,229,0)), radial-gradient(700px 220px at 100% 0%, rgba(255,193,7,0.26), rgba(255,193,7,0))',
      filter: 'blur(40px)'
    },
    container: {
      maxWidth: 1120,
      margin: '0 auto',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative'
    },
    brand: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontWeight: 700,
      letterSpacing: '0.2px',
      textDecoration: 'none',
      backgroundImage: 'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      fontSize: '18px'
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    },
    iconBtn: {
      width: 38,
      padding: 0,
      justifyContent: 'center'
    },
    linkBase: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      textDecoration: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      letterSpacing: '0.01em',
      height: 38,
      padding: '0 12px',
      border: '1px solid rgba(255,255,255,0.10)'
    },
    linkGhost: {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      color: '#C7D3E8'
    },
    linkPrimary: {
      background: 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
      color: '#FFFFFF',
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 10px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
      fontWeight: 600,
      padding: '0 14px'
    },
    icon: {
      display: 'inline-block',
      transform: 'translateY(1px)'
    },

    mainGap: {
      marginTop: 8
    }
  };

  const css = [
    '.navLink{ transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease; }',
    '.navLink:focus-visible{ outline: none; box-shadow: 0 0 0 2px rgba(127,179,255,0.6); }',
    '.navGhost:hover{ transform: translateY(-1px); box-shadow: 0 12px 22px rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.18); }',
    '.navPrimary:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }',
    '.brand:hover{ opacity: 0.95; }',
    '@media (max-width: 720px){ .hide-sm{ display: none; } }'
  ].join('\n');

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={styles.body}>
        <header style={styles.headerWrap}>
          <div style={{ position: 'relative' }}>
            <div style={styles.glow} aria-hidden="true" />
            <div style={styles.container}>
              <a href="/" style={styles.brand} className="brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={styles.icon}>
                  <path d="M3 12h18M12 3v18" stroke="#7FB3FF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                MyReminder
              </a>
              <nav style={styles.nav}>
                <a href="/dashboard" className="navLink navGhost" style={{ ...styles.linkBase, ...styles.linkGhost }}>My Countdowns</a>
                <a href="/api/auth/signin" className="navLink navGhost hide-sm" style={{ ...styles.linkBase, ...styles.linkGhost }}>Sign in</a>
                <a href="/api/auth/signout" className="navLink navGhost hide-sm" style={{ ...styles.linkBase, ...styles.linkGhost }}>Sign out</a>
                <a href="/account" aria-label="Account" title="Account"
                  className="navLink navGhost"
                  style={{ ...styles.linkBase, ...styles.linkGhost, ...styles.iconBtn }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={styles.icon}>
                    <circle cx="12" cy="8" r="4.2" stroke="#C7D3E8" strokeWidth="1.6" />
                    <path d="M4.8 19.2a7.2 7.2 0 0 1 14.4 0" stroke="#C7D3E8" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </a>
                <a href="/new" className="navLink navPrimary" style={{ ...styles.linkBase, ...styles.linkPrimary }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={styles.icon}>
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Create
                </a>
              </nav>
            </div>
          </div>
        </header>

        <div style={styles.mainGap}>
          {children}
        </div>

        <style dangerouslySetInnerHTML={{ __html: css }} />
      </body>
    </html>
  );
}
