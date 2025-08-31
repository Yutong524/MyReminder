'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function detectTZ() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

export default function NewMomentPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');
    const [timeZone, setTimeZone] = useState(detectTZ());
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState(null);

    useEffect(() => {
        const now = new Date(Date.now() + 60 * 60 * 1000);
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        setDate(`${yyyy}-${mm}-${dd}`);
        setTime(`${hh}:${mi}`);
    }, []);

    const localDateTime = useMemo(() => (date && time ? `${date}T${time}` : ''), [date, time]);

    async function onSubmit(e) {
        e.preventDefault();
        setErr(null);
        setSubmitting(true);
        try {
            const res = await fetch('/api/moments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, localDateTime, timeZone }),
            });
            const json = await res.json();
            if (!res.ok) setErr(json?.error || 'Create failed');
            else router.push(json.url);
        } catch (error) {
            setErr(error?.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main style={{ maxWidth: 560, margin: '40px auto', padding: 16 }}>
            <h1>Create Countdown</h1>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Title
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                        Date
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                    </label>
                    <label>
                        Time
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                    </label>
                </div>

                <label>
                    Time Zone (IANA)
                    <input value={timeZone} onChange={(e) => setTimeZone(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                    <small>Detected: {detectTZ()}</small>
                </label>

                <button disabled={submitting || !title || !localDateTime || !timeZone}>
                    {submitting ? 'Creating...' : 'Create'}
                </button>
                {err && <p style={{ color: 'crimson' }}>{err}</p>}
            </form>
        </main>
    );
}
