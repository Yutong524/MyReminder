'use client';
import { useEffect, useState } from 'react';

export default function CheerGuestbook({ slug, initialCount = 0 }) {
    const [count, setCount] = useState(initialCount);
    const [busy, setBusy] = useState(false);
    const [list, setList] = useState([]);
    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(`/api/moments/${slug}/guestbook`);
                const j = await r.json(); if (j?.entries) setList(j.entries);
            } catch { }
        })();
    }, [slug]);

    async function cheer() {
        if (busy) return;
        setBusy(true); setErr(null);
        try {
            const r = await fetch(`/api/moments/${slug}/cheer`, { method: 'POST' });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || 'Cheer failed');
            setCount(j.count ?? (count + 1));
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    }

    async function submitNote(e) {
        e.preventDefault(); if (busy) return;
        setBusy(true); setErr(null);
        try {
            const r = await fetch(`/api/moments/${slug}/guestbook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, message: msg })
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || 'Send failed');
            setList([{ ...j.entry }, ...list].slice(0, 50));
            setMsg('');
        } catch (e) { setErr(e.message); } finally { setBusy(false); }
    }

    return (
        <section style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={cheer} disabled={busy} style={{ padding: '8px 12px', borderRadius: 8 }}>
                    {busy ? 'Cheering…' : 'Cheer'}
                </button>
                <span style={{ opacity: .85 }}>{count} cheers</span>
            </div>
            <div style={{ marginTop: 16 }}>
                <h3 style={{ margin: '12px 0' }}>Guestbook</h3>
                <form onSubmit={submitNote} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                    <input placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ padding: 8 }} />
                    <textarea placeholder="Say something nice (max 280 chars)" maxLength={280}
                        value={msg} onChange={e => setMsg(e.target.value)} required style={{ padding: 8, minHeight: 72 }} />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button disabled={busy || !msg.trim()}>{busy ? 'Sending…' : 'Post note'}</button>
                        {err && <small style={{ color: 'crimson' }}>{err}</small>}
                    </div>
                </form>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                    {list.map(i => (
                        <li key={i.id} style={{ padding: 10, border: '1px solid rgba(0,0,0,.1)', borderRadius: 8 }}>
                            <div style={{ fontWeight: 600 }}>{i.name || 'Anonymous'}</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{i.message}</div>
                            <div style={{ opacity: .6, fontSize: 12, marginTop: 4 }}>
                                {new Date(i.createdAt).toLocaleString()}
                            </div>
                        </li>
                    ))}
                    {list.length === 0 && <li style={{ opacity: .7 }}>No notes yet.</li>}
                </ul>
            </div>
        </section>
    );
}
