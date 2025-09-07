'use client';
import { useEffect } from 'react';

export default function AnalyticsTracker({ slug }) {
    useEffect(() => {
        try {
            const body = {
                ref: document.referrer || '',
                selfOrigin: window.location.origin
            };
            fetch(`/api/moments/${slug}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                keepalive: true,
            }).catch(() => { });
        } catch { }
    }, [slug]);
    return null;
}
