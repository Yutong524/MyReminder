'use client';
import { useEffect, useState } from 'react';

export default function AdminEpicClient() {
    const [status, setStatus] = useState('PENDING');
    const [q, setQ] = useState('');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    async function load() {
        setLoading(true); setErr('');
        try {
            const u = new URLSearchParams({ status, q, page: '1', pageSize: '50' });
            const r = await fetch(`/api/admin/epic/applications?${u}`, { cache: 'no-store' });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || 'Load failed');
            setItems(j.items || []); setTotal(j.total || 0);
        } catch (e) { setErr(e.message || 'Load failed'); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);
    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
    }, [q]);

    async function approve(id, currentCategory) {
        const cat = prompt('Category (optional):', currentCategory || '');
        if (cat === null) return;
        const r = await fetch(`/api/admin/epic/applications/${id}/approve`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: cat })
        });
        r.ok ? load() : alert('Approve failed');
    }

    async function reject(id) {
        const reason = prompt('Reason (optional):', '');
        if (reason === null) return;
        const r = await fetch(`/api/admin/epic/applications/${id}/reject`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason })
        });
        r.ok ? load() : alert('Reject failed');
    }

    const row = (it) => (
        <tr key={it.id}>
            <td>
                <div style={{ display: 'grid', gap: 4 }}>
                    <a href={`/c/${it.moment.slug}`} style={{ color: '#EAF2FF', textDecoration: 'none', fontWeight: 600 }}>
                        {it.moment.title}
                    </a>
                    <small style={{ opacity: .8 }}>/c/{it.moment.slug} · 👁 {it.moment.views} · 🎉 {it.moment.cheerCount}</small>
                </div>
            </td>
            <td>
                <div style={{ display: 'grid', gap: 2 }}>
                    <span>{it.applicant.name || '—'}</span>
                    <small style={{ opacity: .8 }}>{it.applicant.email}</small>
                </div>
            </td>
            <td>{it.category || '—'}</td>
            <td style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={it.note || ''}>
                {it.note || '—'}
            </td>
            <td><span style={{ opacity: .9, fontSize: 12 }}>{it.status}</span></td>
            <td>
                {it.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => approve(it.id, it.category)}>Approve</button>
                        <button onClick={() => reject(it.id)}>Reject</button>
                    </div>
                ) : (
                    <a href={`/c/${it.moment.slug}`}>Open</a>
                )}
            </td>
        </tr>
    );

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8 }}>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
                <input placeholder="Search title / slug / email" value={q} onChange={(e) => setQ(e.target.value)} />
                <button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
            </div>

            {err && <div style={{ color: 'crimson' }}>{err}</div>}
            <small style={{ opacity: .8 }}>Total: {total}</small>

            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                    <tr>
                        <th align="left">Moment</th>
                        <th align="left">Applicant</th>
                        <th align="left">Category</th>
                        <th align="left">Note</th>
                        <th align="left">Status</th>
                        <th align="left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length ? items.map(row) : (
                        <tr><td colSpan={6} style={{ opacity: .75 }}>No items.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
