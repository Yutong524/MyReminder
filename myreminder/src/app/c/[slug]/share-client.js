'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ShareControls({ slug, title }) {
    const [copied, setCopied] = useState(false);

    const fullUrl = useMemo(() => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/c/${slug}`;
        }
        const base = process.env.NEXT_PUBLIC_SITE_URL || '';
        return `${base.replace(/\/$/, '')}/c/${slug}`;
    }, [slug]);

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
        </div>
    );
}
