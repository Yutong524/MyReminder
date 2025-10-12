'use client';
import { useEffect, useMemo, useState } from 'react';

export default function AccountClient({
    initialEmail = '',
    initialTwoFA = false,
    initialLinked = [],
    hasEmailLogin = true,
    initialProfile = { name: '', image: '' }
}) {
    const [email, setEmail] = useState(initialEmail);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const [twoFAEnabled, setTwoFAEnabled] = useState(!!initialTwoFA);
    const [qr, setQr] = useState(null);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [backupCodes, setBackupCodes] = useState(null);
    const [disabling, setDisabling] = useState(false);
    const [otpForEmail, setOtpForEmail] = useState('');
    const [backupForEmail, setBackupForEmail] = useState('');
    const [linked, setLinked] = useState(initialLinked);
    const [unlinking, setUnlinking] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loadingSess, setLoadingSess] = useState(false);
    const [revoking, setRevoking] = useState(null);
    const [revokingAll, setRevokingAll] = useState(false);

    const [events, setEvents] = useState([]);
    const [loadingLog, setLoadingLog] = useState(false);

    const [open, setOpen] = useState({
        overview: true,
        email: true,
        twofa: true,
        linked: true,
        sessions: false,
        log: false
    });
    function setAll(openState) {
        setOpen({
            overview: openState,
            email: openState,
            twofa: openState,
            linked: openState,
            sessions: openState,
            log: openState
        });
    }

    const [sessionQuery, setSessionQuery] = useState('');
    const [logQuery, setLogQuery] = useState('');

    useEffect(() => {
        setTwoFAEnabled(!!initialTwoFA);
    }, [initialTwoFA]);

    useEffect(() => {
        setLinked(initialLinked || []);
    }, [initialLinked]);

    async function loadSessions() {
        setLoadingSess(true);
        const r = await fetch('/api/account/sessions', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        setLoadingSess(false);
        if (r.ok) setSessions(j.items || []);
    }

    async function revokeOne(id) {
        setRevoking(id);
        setErr(''); setMsg('');
        const r = await fetch('/api/account/sessions/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: id })
        });
        const j = await r.json().catch(() => ({}));
        setRevoking(null);
        if (!r.ok) { setErr(j?.error || 'Revoke failed'); return; }
        setMsg('Session revoked.');
        loadSessions();
    }

    async function revokeOthers() {
        setRevokingAll(true);
        setErr(''); setMsg('');
        const r = await fetch('/api/account/sessions/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allOthers: true })
        });

        const j = await r.json().catch(() => ({}));
        setRevokingAll(false);
        if (!r.ok) { setErr(j?.error || 'Revoke failed'); return; }
        setMsg('Signed out from other devices.');
        loadSessions();
    }

    async function loadSecurityLog() {
        setLoadingLog(true);
        const r = await fetch('/api/account/security-events', { cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        setLoadingLog(false);
        if (r.ok) setEvents(j.items || []);
    }

    useEffect(() => { loadSessions(); loadSecurityLog(); }, []);

    const styles = {
        sec: {
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.10)',
            background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            marginTop: 14
        },
        secHead: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            color: '#EAF2FF',
            fontWeight: 700,
            letterSpacing: '0.01em'
        },
        secBody: {
            padding: 14,
            borderTop: '1px solid rgba(255,255,255,0.08)'
        },
        row: {
            display: 'grid',
            gap: 10
        },
        input: {
            width: '100%',
            padding: 10,
            borderRadius: 10,
            border: '1px solid rgba(127,179,255,0.25)',
            background:
                'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF',
            outline: 'none'
        },
        btn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
                'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#fff',
            fontWeight: 600,
            boxShadow:
                '0 12px 24px rgba(13,99,229,0.30),' +
                ' inset 0 1px 0 rgba(255,255,255,0.20)'
        },
        btnGhost: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.10)',
            background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            color: '#C7D3E8'
        },
        danger: {
            border: '1px solid rgba(255,80,80,0.35)',
            background:
                'linear-gradient(180deg, rgba(255,80,80,0.15), rgba(255,80,80,0.08))',
            color: '#FFD8D8'
        },
        hint: {
            fontSize: 13,
            color: '#88A0BF'
        },
        codeList: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))',
            gap: 8,
            marginTop: 10
        },
        listRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
        },
        providerBadge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            color: '#C7D3E8',
            fontSize: 13,
            letterSpacing: '0.01em'
        },
        tag: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            color: '#C7D3E8',
            fontSize: 12
        },
        rowFx: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
        },
        overview: {
            wrap: { display: 'grid', gap: 10, gridTemplateColumns: '64px 1fr' },
            avatar: {
                width: 64, height: 64, borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                objectFit: 'cover'
            },
            name: { fontWeight: 700, letterSpacing: '0.01em' },
            line: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }
        }
    };

    const css = [
        '.i{ transition: border-color 160ms ease, box-shadow 160ms ease; }',
        '.i:focus{ box-shadow: 0 0 0 3px rgba(127,179,255,0.35); border-color: rgba(127,179,255,0.6); }',
        '.cta{ transition: transform 160ms ease, box-shadow 160ms ease; }',
        '.cta:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }',
        '.hbtn{ cursor:pointer; user-select:none; }',
        '.kbd{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px; padding:2px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.06); }'
    ].join('\n');

    async function onStart2FA() {
        setErr('');
        setMsg('');
        setBackupCodes(null);

        const res = await fetch('/api/account/2fa/setup', { method: 'POST' });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            setErr(json?.error || 'Failed to start 2FA');
            return;
        }
        setQr(json.qrDataUrl);
    }

    async function onVerify2FA() {
        if (!otp) return;

        setVerifying(true);
        setErr('');
        setMsg('');
        setBackupCodes(null);

        const res = await fetch('/api/account/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: otp })
        });

        const json = await res.json().catch(() => ({}));
        setVerifying(false);

        if (!res.ok) {
            setErr(json?.error || 'Verification failed');
            return;
        }

        setTwoFAEnabled(true);
        setQr(null);
        setBackupCodes(json.backupCodes || []);
        setMsg('Two-factor authentication enabled.');
        setOtp('');
    }

    async function onDisable2FA() {
        setDisabling(true);
        setErr('');
        setMsg('');

        const res = await fetch('/api/account/2fa/disable', { method: 'POST' });
        const json = await res.json().catch(() => ({}));

        setDisabling(false);

        if (!res.ok) {
            setErr(json?.error || 'Disable failed');
            return;
        }

        setTwoFAEnabled(false);
        setQr(null);
        setBackupCodes(null);
        setMsg('Two-factor authentication disabled.');
    }

    async function onUpdateEmail(e) {
        e.preventDefault();

        setSaving(true);
        setErr('');
        setMsg('');

        const payload = { email };

        if (twoFAEnabled) {
            if (otpForEmail) payload.token = otpForEmail;
            if (!otpForEmail && backupForEmail) payload.backupCode = backupForEmail;
        }

        const res = await fetch('/api/account/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json().catch(() => ({}));

        setSaving(false);

        if (!res.ok) {
            setErr(json?.error || 'Update failed');
            return;
        }

        setMsg('Email updated.');
        setOtpForEmail('');
        setBackupForEmail('');
    }

    const googleLinked = linked.some(l => l.provider === 'google');
    const totalSigninMethods = (hasEmailLogin ? 1 : 0) + linked.length;
    const canUnlink = (provider) => {
        if (totalSigninMethods <= 1) return false;
        return true;
    };

    async function onUnlink(provider, providerAccountId) {
        if (!canUnlink(provider)) {
            setErr('You must keep at least one sign-in method.');
            return;
        }
        setErr(''); setMsg('');
        setUnlinking(true);
        try {
            // 修复：原实现中使用未定义变量 a / acc
            const r = await fetch(`/api/account/unlink/${encodeURIComponent(provider)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerAccountId })
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j?.error || 'Unlink failed');

            setLinked(prev => prev.filter(a => !(a.provider === provider && a.providerAccountId === providerAccountId)));
            setMsg('Unlinked successfully.');
        } catch (e) {
            setErr(e.message || 'Unlink failed');
        } finally {
            setUnlinking(false);
        }
    }

    const filteredSessions = useMemo(() => {
        if (!sessionQuery.trim()) return sessions;
        const q = sessionQuery.toLowerCase();
        return sessions.filter(s =>
            (s.ip || '').toLowerCase().includes(q) ||
            (s.userAgent || '').toLowerCase().includes(q)
        );
    }, [sessionQuery, sessions]);

    const filteredEvents = useMemo(() => {
        if (!logQuery.trim()) return events;
        const q = logQuery.toLowerCase();
        return events.filter(ev =>
            (ev.type || '').toLowerCase().includes(q) ||
            (ev.ip || '').toLowerCase().includes(q) ||
            (ev.userAgent || '').toLowerCase().includes(q)
        );
    }, [logQuery, events]);

    const TwoFAChip = () => (
        <span style={{ ...styles.tag, borderColor: twoFAEnabled ? 'rgba(139, 209, 124, 0.45)' : 'rgba(255, 193, 7, 0.35)' }}>
            {twoFAEnabled ? '2FA: On' : '2FA: Off'}
        </span>
    );

    return (
        <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button className="cta hbtn" style={styles.btnGhost} onClick={() => setAll(true)} aria-label="Expand all sections">
                    Expand all
                </button>
                <button className="cta hbtn" style={styles.btnGhost} onClick={() => setAll(false)} aria-label="Collapse all sections">
                    Collapse all
                </button>
            </div>

            <section style={styles.sec}>
                <div
                    style={styles.secHead}
                >
                    <div>Overview</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <TwoFAChip />
                        <span style={styles.tag}>Methods: {(hasEmailLogin ? 1 : 0) + linked.length}</span>
                        <span style={styles.tag}>Sessions: {sessions.length}</span>
                    </div>
                </div>
                <div style={styles.secBody}>
                    <div style={styles.overview.wrap}>
                        <img
                            src={initialProfile?.image || '/avatar.svg'}
                            alt={initialProfile?.name || 'User avatar'}
                            style={styles.overview.avatar}
                        />
                        <div>
                            <div style={styles.overview.name}>
                                {initialProfile?.name || 'Unnamed User'}
                            </div>
                            <div style={{ ...styles.hint, marginTop: 4 }}>
                                {email}
                            </div>
                            <div style={{ ...styles.overview.line, marginTop: 8 }}>
                                <a className="cta" style={styles.btnGhost} href="#email">Edit email</a>
                                <a className="cta" style={styles.btnGhost} href="#twofa">Manage 2FA</a>
                                <a className="cta" style={styles.btnGhost} href="#linked">Linked accounts</a>
                                <a className="cta" style={styles.btnGhost} href="#sessions">Sessions</a>
                                <a className="cta" style={styles.btnGhost} href="#log">Security log</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section style={styles.sec} id="email">
                <div style={styles.secHead}>
                    <button
                        className="hbtn"
                        onClick={() => setOpen(v => ({ ...v, email: !v.email }))}
                        aria-expanded={open.email}
                        aria-controls="email-body"
                        style={{ all: 'unset', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Email
                    </button>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="kbd">E</span>
                    </div>
                </div>

                {open.email && (
                    <div id="email-body" style={styles.secBody}>
                        <form onSubmit={onUpdateEmail} style={styles.row}>
                            <label>
                                <div className="label">Current / New email</div>
                                <input
                                    className="i"
                                    style={styles.input}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>

                            {twoFAEnabled && (
                                <>
                                    <label>
                                        <div className="label">
                                            TOTP code (when 2FA is enabled)
                                        </div>
                                        <input
                                            className="i"
                                            style={styles.input}
                                            placeholder="123456"
                                            value={otpForEmail}
                                            onChange={(e) => setOtpForEmail(e.target.value)}
                                        />
                                    </label>

                                    <div style={styles.hint}>
                                        Or use a one-time backup code if you can’t access your app:
                                    </div>

                                    <label>
                                        <div className="label">Backup code (optional)</div>
                                        <input
                                            className="i"
                                            style={styles.input}
                                            placeholder="BACKUPCODE"
                                            value={backupForEmail}
                                            onChange={(e) => setBackupForEmail(e.target.value)}
                                        />
                                    </label>
                                </>
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center'
                                }}
                            >
                                <button className="cta" style={styles.btn} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save email'}
                                </button>

                                <span style={styles.hint}>
                                    We recommend enabling 2FA before changing sensitive info.
                                </span>
                            </div>
                        </form>
                    </div>
                )}
            </section>

            <section style={styles.sec} id="twofa">
                <div style={styles.secHead}>
                    <button
                        className="hbtn"
                        onClick={() => setOpen(v => ({ ...v, twofa: !v.twofa }))}
                        aria-expanded={open.twofa}
                        aria-controls="twofa-body"
                        style={{ all: 'unset', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Two-Factor Authentication (TOTP)
                    </button>
                    <TwoFAChip />
                </div>

                {open.twofa && (
                    <div id="twofa-body" style={styles.secBody}>
                        {!twoFAEnabled && !qr && (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'center'
                                }}
                            >
                                <button
                                    className="cta"
                                    style={styles.btn}
                                    onClick={onStart2FA}
                                >
                                    Enable 2FA
                                </button>

                                <span style={styles.hint}>
                                    Use an authenticator app (Google Authenticator, 1Password, etc.).
                                </span>
                            </div>
                        )}

                        {!twoFAEnabled && qr && (
                            <div style={{ display: 'grid', gap: 12 }}>
                                <div>
                                    <img
                                        src={qr}
                                        alt="Scan QR in your authenticator app"
                                        style={{
                                            width: 180,
                                            height: 180,
                                            borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    />
                                </div>

                                <label>
                                    <div className="label">Enter 6-digit code</div>
                                    <input
                                        className="i"
                                        style={styles.input}
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </label>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="cta"
                                        style={styles.btn}
                                        onClick={onVerify2FA}
                                        disabled={verifying || !otp}
                                    >
                                        {verifying ? 'Verifying…' : 'Verify & enable'}
                                    </button>

                                    <button
                                        className="cta"
                                        style={styles.btnGhost}
                                        onClick={() => {
                                            setQr(null);
                                            setOtp('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {twoFAEnabled && (
                            <div style={{ display: 'grid', gap: 10 }}>
                                <div style={styles.hint}>
                                    2FA is enabled for your account.
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        className="cta"
                                        style={{ ...styles.btnGhost, ...styles.danger }}
                                        onClick={onDisable2FA}
                                        disabled={disabling}
                                    >
                                        {disabling ? 'Disabling…' : 'Disable 2FA'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {backupCodes && backupCodes.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={styles.hint}>
                                    Save these one-time backup codes in a safe place:
                                </div>

                                <div style={styles.codeList}>
                                    {backupCodes.map((c) => (
                                        <code
                                            key={c}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: 8,
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.04)'
                                            }}
                                        >
                                            {c}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section style={styles.sec} id="linked">
                <div style={styles.secHead}>
                    <button
                        className="hbtn"
                        onClick={() => setOpen(v => ({ ...v, linked: !v.linked }))}
                        aria-expanded={open.linked}
                        aria-controls="linked-body"
                        style={{ all: 'unset', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Linked accounts
                    </button>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={styles.tag}>Total {linked.length + (hasEmailLogin ? 1 : 0)}</span>
                    </div>
                </div>
                {open.linked && (
                    <div id="linked-body" style={styles.secBody}>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {linked.length === 0 && (
                                <div style={styles.hint}>No linked providers yet.</div>
                            )}

                            {linked.map(acc => (
                                <div key={`${acc.provider}:${acc.providerAccountId}`} style={styles.listRow}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={styles.providerBadge}>
                                            {acc.provider === 'google' ? (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <circle cx="12" cy="12" r="10" stroke="#7FB3FF" strokeWidth="1.4" />
                                                    </svg>
                                                    Google
                                                </>
                                            ) : acc.provider}
                                        </span>
                                        <code style={{ opacity: .75, fontSize: 12 }}>
                                            {acc.providerAccountId}
                                        </code>
                                    </div>
                                    <button
                                        className="cta"
                                        style={{ ...styles.btnGhost, ...styles.danger }}
                                        disabled={unlinking || !canUnlink(acc.provider)}
                                        onClick={() => onUnlink(acc.provider, acc.providerAccountId)}
                                        title={!canUnlink(acc.provider) ? 'Keep at least one sign-in method' : 'Unlink this provider'}
                                    >
                                        {unlinking ? 'Working…' : 'Unlink'}
                                    </button>
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                                {!googleLinked ? (
                                    <a
                                        className="cta"
                                        style={styles.btn}
                                        href="/api/auth/signin?provider=google&callbackUrl=/account"
                                    >
                                        Link Google
                                    </a>
                                ) : (
                                    <span style={styles.hint}>Google is linked.</span>
                                )}
                            </div>

                            <div style={styles.hint}>
                                You must keep at least one active sign-in method (email or a linked provider).
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section style={styles.sec} id="sessions">
                <div style={styles.secHead}>
                    <button
                        className="hbtn"
                        onClick={() => setOpen(v => ({ ...v, sessions: !v.sessions }))}
                        aria-expanded={open.sessions}
                        aria-controls="sessions-body"
                        style={{ all: 'unset', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Active sessions & devices
                    </button>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            aria-label="Filter sessions"
                            className="i"
                            style={{ ...styles.input, width: 220 }}
                            placeholder="Filter by IP or user-agent…"
                            value={sessionQuery}
                            onChange={(e) => setSessionQuery(e.target.value)}
                        />
                    </div>
                </div>
                {open.sessions && (
                    <div id="sessions-body" style={styles.secBody}>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {loadingSess && <div style={styles.hint}>Loading sessions…</div>}
                            {filteredSessions.map(s => (
                                <div key={s.id} style={styles.rowFx}>
                                    <div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={styles.tag}>{s.current ? 'This device' : 'Signed in'}</span>
                                            <span style={styles.tag}>{s.ip}</span>
                                            <span style={styles.tag}>
                                                {new Date(s.lastSeenAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ ...styles.hint, marginTop: 6, maxWidth: 760, opacity: .9 }}>
                                            {s.userAgent}
                                        </div>
                                    </div>
                                    {!s.current && (
                                        <button
                                            className="cta"
                                            style={{ ...styles.btnGhost, ...styles.danger }}
                                            onClick={() => revokeOne(s.id)}
                                            disabled={revoking === s.id}
                                        >
                                            {revoking === s.id ? 'Revoking…' : 'Revoke'}
                                        </button>
                                    )}
                                </div>
                            ))}

                            {filteredSessions.length === 0 && !loadingSess && (
                                <div style={styles.hint}>No active sessions.</div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="cta"
                                    style={{ ...styles.btnGhost }}
                                    onClick={revokeOthers}
                                    disabled={revokingAll}
                                >
                                    {revokingAll ? 'Signing out…' : 'Sign out from other devices'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section style={styles.sec} id="log">
                <div style={styles.secHead}>
                    <button
                        className="hbtn"
                        onClick={() => setOpen(v => ({ ...v, log: !v.log }))}
                        aria-expanded={open.log}
                        aria-controls="log-body"
                        style={{ all: 'unset', cursor: 'pointer', fontWeight: 700 }}
                    >
                        Sign-in history / Security log
                    </button>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            aria-label="Filter security log"
                            className="i"
                            style={{ ...styles.input, width: 220 }}
                            placeholder="Filter by type / IP / UA…"
                            value={logQuery}
                            onChange={(e) => setLogQuery(e.target.value)}
                        />
                    </div>
                </div>
                {open.log && (
                    <div id="log-body" style={styles.secBody}>
                        {loadingLog && <div style={styles.hint}>Loading log…</div>}
                        {filteredEvents.length === 0 && !loadingLog && (
                            <div style={styles.hint}>No recent security events.</div>
                        )}
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {filteredEvents.map(ev => (
                                <li key={ev.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={styles.tag}>{ev.type}</span>
                                        <span style={styles.tag}>{ev.ip || '—'}</span>
                                        <span style={styles.tag}>{new Date(ev.createdAt).toLocaleString()}</span>
                                    </div>
                                    {ev.userAgent && (
                                        <div style={{ ...styles.hint, marginTop: 6, opacity: .9 }}>
                                            {ev.userAgent}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {(msg || err) && (
                <p
                    style={{
                        marginTop: 12,
                        color: err ? 'salmon' : '#8BD17C'
                    }}
                    role="status"
                    aria-live="polite"
                >
                    {err || msg}
                </p>
            )}

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </>
    );
}
