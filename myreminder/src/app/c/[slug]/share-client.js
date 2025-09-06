'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ShareControls({ slug, title, theme = 'default' }) {
    const [copied, setCopied] = useState(false);
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        } else {
            const base = process.env.NEXT_PUBLIC_SITE_URL || '';
            setOrigin(base.replace(/\/$/, ''));
        }
    }, []);

    const fullUrl = useMemo(() => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/c/${slug}`;
        }
        const base = process.env.NEXT_PUBLIC_SITE_URL || '';
        return `${base.replace(/\/$/, '')}/c/${slug}`;
    }, [slug]);

    const embedCode = useMemo(() => {
        if (!origin) return '';
        return `<script async src="${origin}/embed.js" data-slug="${slug}" data-theme="${theme}" data-mode="full"></script>`;
    }, [origin, slug, theme]);

    const emailImg = useMemo(() => {
        if (!origin) return '';
        return `${origin}/c/${slug}/email-image`;
    }, [origin, slug]);

    async function copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = fullUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    }

    async function systemShare() {
        if (navigator.share) {
            try {
                await navigator.share({ title: title || 'Countdown', text: title, url: fullUrl });
            } catch { }
        } else {
            await copyLink();
        }
    }

    return (
        <div style={{
            display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12,
            flexWrap: 'wrap'
        }}>
            <input
                readOnly
                value={fullUrl}
                onFocus={(e) => e.target.select()}
                style={{
                    flex: '1 1 360px', minWidth: 0, padding: '10px 12px',
                    background: 'rgba(255,255,255,0.08)', color: 'inherit',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8
                }}
            />
            <button onClick={copyLink} style={{
                padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)', color: 'inherit', cursor: 'pointer'
            }}>
                {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button onClick={systemShare} style={{
                padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.12)', color: 'inherit', cursor: 'pointer'
            }}>
                Share
            </button>

            <details style={{ width: '100%' }}>
                <summary style={{ cursor: 'pointer', marginTop: 6 }}>Embed on your website</summary>
                <p style={{ opacity: .8, marginTop: 6 }}>Paste this where you want the countdown to appear:</p>
                <textarea
                    readOnly
                    value={embedCode}
                    style={{ width: '100%', height: 80, fontFamily: 'ui-monospace,monospace', padding: 6 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={() => copy(embedCode)} style={{
                        padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.08)', color: 'inherit', cursor: 'pointer'
                    }}>
                        {copied ? 'Copied!' : 'Copy embed code'}
                    </button>
                    <small style={{ opacity: .8 }}>Options: <code>data-mode="compact"</code> | <code>data-width</code> | <code>data-height</code></small>
                </div>
            </details>

            <details style={{ width: '100%' }}>
                <summary style={{ cursor: 'pointer', marginTop: 6 }}>Email image</summary>
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                    <code style={{ userSelect: 'all', overflowWrap: 'anywhere' }}>{emailImg}</code>
                    <button onClick={() => copy(emailImg)} style={{
                        padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.08)', color: 'inherit', cursor: 'pointer', width: 'fit-content'
                    }}>
                        {copied ? 'Copied!' : 'Copy image URL'}
                    </button>
                    <small style={{ opacity: .8 }}>
                        Use in <code>&lt;img src="…" /&gt;</code> inside emails.
                        Add <code>?ts=UNIX</code> to bust caches.
                    </small>
                </div>
            </details>
        </div>
    );
}
