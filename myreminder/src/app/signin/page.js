'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInPage({ searchParams }) {
    const callbackUrl = searchParams?.callbackUrl || '/dashboard';
    const error = searchParams?.error;
    const [email, setEmail] = useState('');

    const styles = {
        page: {
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
            color: '#EAF2FF',
            padding: 24
        },
        card: {
            width: '100%',
            maxWidth: 420,
            borderRadius: 20,
            padding: 22,
            background:
                'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow:
                '0 20px 60px rgba(0,0,0,0.45),' +
                ' inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(10px)'
        },
        h1: {
            margin: 0,
            textAlign: 'center',
            fontSize: 'clamp(22px, 3.6vw, 28px)',
            letterSpacing: '-0.02em',
            backgroundImage:
                'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
        },
        sub: {
            textAlign: 'center',
            marginTop: 6,
            marginBottom: 14,
            color: '#B9C6DD',
            fontSize: 14
        },
        input: {
            width: '100%',
            padding: 10,
            borderRadius: 10,
            border: '1px solid rgba(127,179,255,0.25)',
            background:
                'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF',
            outline: 'none',
            marginTop: 6
        },
        btnPrimary: {
            width: '100%',
            marginTop: 12,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
                'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#fff',
            fontWeight: 700,
            boxShadow:
                '0 12px 24px rgba(13,99,229,0.30),' +
                ' inset 0 1px 0 rgba(255,255,255,0.20)'
        },
        or: {
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 8,
            margin: '14px 0',
            color: '#8FA5C6'
        },
        hr: {
            height: 1,
            background: 'rgba(255,255,255,0.08)'
        },
        btnGoogle: {
            width: '100%',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
                'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            color: '#EAF2FF',
            fontWeight: 600
        },
        error: {
            marginTop: 10,
            color: '#FFD8D8',
            background: 'rgba(255,80,80,0.12)',
            border: '1px solid rgba(255,80,80,0.35)',
            padding: 10,
            borderRadius: 10,
            fontSize: 13
        }
    };

    const errMsg = error
        ? (
            {
                OAuthAccountNotLinked:
                    'This email is already linked to another sign-in method.',
                AccessDenied:
                    'Access denied. Please try another account.',
                Configuration:
                    'Auth configuration error. Contact support.'
            }[error] || 'Sign-in error. Please try again.'
        )
        : null;

    return (
        <main style={styles.page}>
            <section style={styles.card}>
                <h1 style={styles.h1}>Sign in</h1>
                <p style={styles.sub}>Use email magic link or Google.</p>

                <label>
                    Email
                    <input
                        type="email"
                        placeholder="email@example.com"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={styles.input}
                    />
                </label>

                <button
                    style={styles.btnPrimary}
                    onClick={() =>
                        signIn('email', { email, callbackUrl })
                    }
                >
                    Sign in with Email
                </button>

                <div style={styles.or}>
                    <div style={styles.hr} />
                    <span>or</span>
                    <div style={styles.hr} />
                </div>

                <button
                    style={styles.btnGoogle}
                    onClick={() =>
                        signIn('google', { callbackUrl })
                    }
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                    >
                        <path
                            fill="#FFC107"
                            d="M43.611 20.083H42V20H24v8h11.303C33.602 31.91 29.083 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.157 7.953 3.047l5.657-5.657C34.676 5.083 29.566 3 24 3 12.955 3 4 11.955 4 23s8.955 20 20 20 19-8.955 19-20c0-1.341-.138-2.651-.389-3.917z"
                        />
                        <path
                            fill="#FF3D00"
                            d="M6.306 14.691l6.571 4.818C14.534 16.065 18.916 13 24 13c3.059 0 5.842 1.157 7.953 3.047l5.657-5.657C34.676 5.083 29.566 3 24 3 16.318 3 9.684 7.337 6.306 14.691z"
                        />
                        <path
                            fill="#4CAF50"
                            d="M24 43c5.013 0 9.576-1.922 13.02-5.055l-6.004-4.938C28.936 34.279 26.6 35 24 35c-5.052 0-9.554-3.057-11.28-7.389l-6.55 5.046C9.5 38.595 16.215 43 24 43z"
                        />
                        <path
                            fill="#1976D2"
                            d="M43.611 20.083H42V20H24v8h11.303C34.602 31.91 29.083 35 24 35v8c8.284 0 19-5.373 19-20 0-1.341-.138-2.651-.389-3.917z"
                        />
                    </svg>
                    Sign in with Google
                </button>

                {errMsg && (
                    <div style={styles.error}>{errMsg}</div>
                )}
            </section>
        </main>
    );
}
