'use client';
import { useState } from 'react';

export default function AccountClient({ initialEmail }) {
    const [email, setEmail] = useState(initialEmail || '');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [err, setErr] = useState(null);

    const styles = {
        row: { display: 'grid', gap: 12, marginTop: 8 },
        label: { fontSize: 13, color: '#C7D3E8' },
        input: {
            width: '100%', padding: 10, borderRadius: 10,
            border: '1px solid rgba(127,179,255,0.25)',
            background: 'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF', outline: 'none'
        },
        btn: {
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#FFFFFF', fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)',
            width: 'fit-content'
        },
        hint: { fontSize: 13, color: '#88A0BF' },
        ok: { color: '#9BEBA3', marginTop: 8 },
        bad: { color: 'crimson', marginTop: 8 }
    };

    async function onSave(e) {
        e.preventDefault();
        setMsg(null); setErr(null);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErr('Please enter a valid email.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/account/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Failed to update email');
            setMsg('Email updated successfully.');
        } catch (e) {
            setErr(e.message || 'Failed to update email');
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={onSave} style={{ display: 'grid', gap: 12 }}>
            <div style={styles.row}>
                <label style={styles.label}>Current email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" className="i" style={styles.input} />
                <small style={styles.hint}>This address is used for sign-in and notifications.</small>
            </div>
            
            <button style={styles.btn} disabled={saving} aria-busy={saving ? 'true' : 'false'}>
                {saving ? 'Saving…' : 'Save email'}
            </button>

            {msg && <p style={styles.ok}>{msg}</p>}
            {err && <p style={styles.bad}>{err}</p>}
            <style
                dangerouslySetInnerHTML={{
                    __html:
                        '.i{ transition: border-color 160ms ease, box-shadow 160ms ease; }' +
                        '.i:focus{ box-shadow: 0 0 0 3px rgba(127,179,255,0.35); border-color: rgba(127,179,255,0.6); }'
                }}
            />
        </form>
    );
}
