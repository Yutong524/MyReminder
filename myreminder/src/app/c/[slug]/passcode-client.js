'use client';
import { useState } from 'react';

export default function AccessGateClient({ slug }) {
    const [passcode, setPasscode] = useState('');
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setErr(null); setBusy(true);
        try {
            const res = await fetch(`/api/moments/${slug}/access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Access denied');
            window.location.reload();
        } catch (e) {
            setErr(e.message || 'Access denied');
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 8 }}>
            <label>
                Passcode
                <input
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    minLength={4}
                    maxLength={64}
                    style={{ width: '100%', padding: 8 }}
                />
            </label>
            <button disabled={busy || !passcode}>{busy ? 'Checking…' : 'Unlock'}</button>
            {err && <p style={{ color: 'crimson' }}>{err}</p>}
        </form>
    );
}
