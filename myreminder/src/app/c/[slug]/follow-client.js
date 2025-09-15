'use client';
import { useState, useTransition } from 'react';

export default function FollowButton({ slug, initialFollowed }) {
    const [followed, setFollowed] = useState(!!initialFollowed);
    const [isPending, startTransition] = useTransition();

    const styles = {
        btn: {
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 36, padding: '0 12px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background: followed
                ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
                : 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#FFFFFF', fontWeight: 600,
            boxShadow: followed ? 'none' : '0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
            opacity: isPending ? .7 : 1, cursor: isPending ? 'wait' : 'pointer'
        }
    };

    async function toggle() {
        startTransition(async () => {
            const op = followed ? 'unfollow' : 'follow';
            const res = await fetch(`/api/moments/${slug}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ op })
            });
            if (res.ok) {
                const j = await res.json().catch(() => ({}));
                setFollowed(!!j.followed);
            }
        });
    }

    return (
        <button type="button" onClick={toggle} style={styles.btn} aria-busy={isPending ? 'true' : 'false'}>
            {followed ? (
                <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12l4 4L19 6" stroke="#7FB3FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Following
                </>
            ) : (
                <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Follow
                </>
            )}
        </button>
    );
}
