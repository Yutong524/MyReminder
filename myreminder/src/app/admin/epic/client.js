'use client';
import { useEffect, useState } from 'react';

export default function AdminEpicClient() {
    const [status, setStatus] = useState('PENDING');
    const [q, setQ] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    async function load() {
        setLoading(true); setErr('');
        try {
            const params = new URLSearchParams({
                status,
                q,
                category,
                page: String(page),
                pageSize: String(pageSize)
            });
            const r = await fetch(
                `/api/admin/epic/applications?${params.toString()}`,
                { cache: 'no-store' }
            );
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || 'Load failed');
            setData(j);
        } catch (e) {
            setErr(e.message || 'Load failed');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [status, page, pageSize]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            load();
        }, 300);

        return () => clearTimeout(t);
    }, [q, category]);

    async function approve(id, currentCategory) {
        const cat = prompt('Set category (optional):', currentCategory || '');
        if (cat === null) return;
        const r = await fetch(
            `/api/admin/epic/applications/${id}/approve`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: cat })
            }
        );
        if (r.ok) {
            load();
        } else {
            alert('Approve failed');
        }
    }

    async function reject(id) {
        const reason = prompt('Reason (optional):', '');
        if (reason === null) return;
        const r = await fetch(
            `/api/admin/epic/applications/${id}/reject`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            }
        );
        if (r.ok) {
            load();
        } else {
            alert('Reject failed');
        }
    }

    const styles = {
        bar: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 8,
            marginTop: 12,
            marginBottom: 12
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
            fontSize: 14
        },
        select: {
            width: '100%',
            padding: 10,
            borderRadius: 10,
            border: '1px solid rgba(127,179,255,0.25)',
            background:
                'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF',
            outline: 'none',
            fontSize: 14
        },
        table: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            marginTop: 6
        },
        th: {
            textAlign: 'left',
            fontWeight: 700,
            fontSize: 13,
            color: '#C7D3E8',
            padding: '10px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
        },
        td: {
            fontSize: 13,
            color: '#EAF2FF',
            padding: '10px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            verticalAlign: 'top'
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.10)',
            background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            color: '#C7D3E8',
            fontSize: 12
        },
        actRow: {
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap'
        },
        btn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
                'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#FFFFFF',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow:
                '0 10px 20px rgba(13,99,229,0.30),' +
                ' inset 0 1px 0 rgba(255,255,255,0.20)',
            fontSize: 12
        },
        btnGhost: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            color: '#C7D3E8',
            fontWeight: 600,
            letterSpacing: '0.01em',
            fontSize: 12
        },
        danger: {
            border: '1px solid rgba(255,80,80,0.35)',
            background:
                'linear-gradient(180deg, rgba(255,80,80,0.15), rgba(255,80,80,0.08))',
            color: '#FFD8D8'
        },
        pager: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            justifyContent: 'flex-end'
        }
    };

    return (
        <div>
            <div style={styles.bar}>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                    }}
                    style={styles.select}
                >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>

                <input
                    placeholder="Search title / slug / email"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    style={styles.input}
                />

                <input
                    placeholder="Category (filter)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={styles.input}
                />

                <select
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                    }}
                    style={styles.select}
                >
                    {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                            {n}/page
                        </option>
                    ))}
                </select>
            </div>

            {err && (
                <div style={{ color: 'crimson', marginBottom: 8 }}>
                    {err}
                </div>
            )}

            {loading && (
                <div style={{ color: '#B9C6DD', marginBottom: 8 }}>
                    Loading…
                </div>
            )}

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Moment</th>
                        <th style={styles.th}>Applicant</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Note</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {data.items.map((item) => (
                        <tr key={item.id}>
                            <td style={styles.td}>
                                <div style={{ display: 'grid', gap: 4 }}>
                                    <a
                                        href={`/c/${item.moment.slug}`}
                                        style={{
                                            color: '#EAF2FF',
                                            textDecoration: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        {item.moment.title}
                                    </a>

                                    <div>
                                        <span style={styles.badge}>
                                            /c/{item.moment.slug}
                                        </span>{' '}
                                        <span style={styles.badge}>
                                            👁 {item.moment.views} · 🎉 {item.moment.cheerCount}
                                        </span>{' '}
                                        {item.moment.isEpic && (
                                            <span style={styles.badge}>EPIC</span>
                                        )}
                                    </div>
                                </div>
                            </td>

                            <td style={styles.td}>
                                <div style={{ display: 'grid', gap: 2 }}>
                                    <span>{item.applicant.name || '—'}</span>
                                    <span style={{ opacity: 0.8 }}>
                                        {item.applicant.email}
                                    </span>
                                </div>
                            </td>

                            <td style={styles.td}>
                                {item.category || '—'}
                            </td>

                            <td
                                style={{
                                    ...styles.td,
                                    opacity: 0.9,
                                    maxWidth: 280,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                                title={item.note || ''}
                            >
                                {item.note || '—'}
                            </td>

                            <td style={styles.td}>
                                <div style={{ display: 'grid', gap: 4 }}>
                                    <span style={styles.badge}>{item.status}</span>

                                    {item.type === 'SECURITY_LOGIN_ALERT' && (
                                        <span style={{
                                            ...styles.badge,
                                            border: '1px solid rgba(255,215,0,0.35)',
                                            background: 'linear-gradient(180deg, rgba(255,215,0,0.18), rgba(255,215,0,0.08))',
                                            color: '#FFE58A',
                                            fontWeight: 700
                                        }}>
                                            New device
                                        </span>
                                    )}

                                    {(item.meta?.city || item.meta?.ip) && (
                                        <span style={styles.badge}>
                                            {item.meta?.city ? `${item.meta.city}` : ''}
                                            {item.meta?.city && item.meta?.ip ? ' · ' : ''}
                                            {item.meta?.ip ? `IP ${item.meta.ip}` : ''}
                                        </span>
                                    )}

                                    {item.decidedAt && (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: '#8FA5C6'
                                            }}
                                        >
                                            {new Date(item.decidedAt).toLocaleString()}
                                        </span>
                                    )}

                                    {item.reason && (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: '#FFD8D8'
                                            }}
                                        >
                                            Reason: {item.reason}
                                        </span>
                                    )}
                                </div>
                            </td>

                            <td style={styles.td}>
                                <div style={styles.actRow}>
                                    {item.status === 'PENDING' ? (
                                        <>
                                            <button
                                                style={styles.btn}
                                                onClick={() =>
                                                    approve(item.id, item.category)
                                                }
                                            >
                                                Approve
                                            </button>

                                            <button
                                                style={{ ...styles.btnGhost, ...styles.danger }}
                                                onClick={() => reject(item.id)}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    ) : (
                                        <a
                                            href={`/c/${item.moment.slug}`}
                                            style={styles.btnGhost}
                                        >
                                            Open
                                        </a>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}

                    {data.items.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                style={{ ...styles.td, color: '#B9C6DD' }}
                            >
                                No items.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div style={styles.pager}>
                <span style={{ color: '#8FA5C6', fontSize: 12 }}>
                    Total: {data.total}
                </span>

                <button
                    className="pg"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={styles.btnGhost}
                >
                    Prev
                </button>

                <span style={{ color: '#EAF2FF', fontSize: 12 }}>
                    Page {page}
                </span>

                <button
                    className="pg"
                    disabled={page * pageSize >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                    style={styles.btnGhost}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
