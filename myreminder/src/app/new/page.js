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
    const [email, setEmail] = useState('');
    const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
    const [smsPhone, setSmsPhone] = useState('');
    const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
    const [rule7, setRule7] = useState(true);
    const [rule3, setRule3] = useState(true);
    const [rule1, setRule1] = useState(true);
    const [rule0, setRule0] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState(null);
    const [theme, setTheme] = useState('default');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [passcode, setPasscode] = useState('');
    const [bgmUrl, setBgmUrl] = useState('');
    const [bgmFile, setBgmFile] = useState(null);
    const [bgmLoop, setBgmLoop] = useState(true);
    const [bgmVolume, setBgmVolume] = useState(50);
    const [endKey, setEndKey] = useState('none'); // 'none'|'bell'|'chime'|'beep'|'custom'
    const [endUrl, setEndUrl] = useState('');
    const [endFile, setEndFile] = useState(null);
    const [endVolume, setEndVolume] = useState(80);
    const [recType, setRecType] = useState('NONE'); // NONE|DAILY|WEEKDAYS|WEEKLY
    const [wk, setWk] = useState({ MO: false, TU: false, WE: false, TH: false, FR: false, SA: false, SU: false });

    const [openBasics, setOpenBasics] = useState(true);
    const [openAccess, setOpenAccess] = useState(true);
    const [openNotify, setOpenNotify] = useState(false);
    const [openAudio, setOpenAudio] = useState(false);
    const [openRepeat, setOpenRepeat] = useState(false);

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

    const localDateTime = useMemo(
        () => (date && time ? `${date}T${time}` : ''),
        [date, time]
    );

    const canSubmit = !!(
        title.trim() &&
        localDateTime &&
        timeZone &&
        (visibility !== 'PRIVATE' || (passcode && passcode.trim().length >= 4))
    );

    async function onSubmit(e) {
        e.preventDefault();
        if (!canSubmit || submitting) return;
        setErr(null);
        setSubmitting(true);
        try {

            let finalBgmUrl = bgmUrl.trim();
            if (!finalBgmUrl && bgmFile) {
                const fd = new FormData(); fd.append('file', bgmFile);
                const up = await fetch('/api/upload/audio', { method: 'POST', body: fd });
                const uj = await up.json(); if (!up.ok) throw new Error(uj?.error || 'Upload failed');
                finalBgmUrl = uj.url;
            }
            let finalEndUrl = (endKey === 'custom') ? endUrl.trim() : '';
            if (endKey === 'custom' && !finalEndUrl && endFile) {
                const fd2 = new FormData(); fd2.append('file', endFile);
                const up2 = await fetch('/api/upload/audio', { method: 'POST', body: fd2 });
                const uj2 = await up2.json(); if (!up2.ok) throw new Error(uj2?.error || 'Upload failed');
                finalEndUrl = uj2.url;
            }

            const res = await fetch('/api/moments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    localDateTime,
                    timeZone,
                    theme,
                    email,
                    slackWebhookUrl,
                    smsPhone,
                    discordWebhookUrl,
                    rules: { seven: rule7, three: rule3, one: rule1, dayOf: rule0 },
                    visibility,
                    passcode: visibility === 'PRIVATE' ? passcode : undefined,
                    bgmUrl: finalBgmUrl || undefined,
                    bgmLoop,
                    bgmVolume,
                    endSoundKey: endKey === 'custom' ? undefined : endKey, // none|bell|chime|beep
                    endSoundUrl: endKey === 'custom' ? finalEndUrl : undefined,
                    endSoundVolume: endVolume,
                    recurrence: recType === 'NONE' ? undefined : {
                        type: recType,
                        days: recType === 'WEEKLY' ? Object.entries(wk).filter(([, v]) => v).map(([k]) => k) : undefined
                    }
                }),
            });

            let data;
            try {
                data = await res.clone().json();
            } catch {
                data = { error: await res.text() };
            }

            if (!res.ok) {
                throw new Error(data?.error || 'Create failed');
            }

            router.push(data.url);
        } catch (error) {
            setErr(error?.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    }

    const styles = {
        page: {
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            padding: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)',
            color: '#EAF2FF'
        },
        grid: {
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px, 40px 40px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)',
            pointerEvents: 'none'
        },
        rays: {
            position: 'absolute',
            inset: 0,
            background: 'conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)',
            filter: 'blur(40px)',
            pointerEvents: 'none'
        },
        shell: {
            width: '100%',
            maxWidth: 720,
            margin: '40px auto',
            padding: 16
        },
        card: {
            position: 'relative',
            borderRadius: '20px',
            background: 'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '26px',
            backdropFilter: 'blur(10px)'
        },
        h1: {
            margin: 0,
            fontSize: 'clamp(26px, 4.2vw, 34px)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            backgroundImage: 'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
        },
        sub: {
            marginTop: 8,
            marginBottom: 16,
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#B9C6DD'
        },
        stepper: {
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            margin: '8px 0 16px'
        },
        stepPill: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 34,
            padding: '0 12px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            color: '#C7D3E8',
            fontSize: '13px'
        },
        dotBlue: {
            width: 8,
            height: 8,
            borderRadius: 99,
            background: '#0D63E5',
            boxShadow: '0 0 0 2px rgba(13,99,229,0.25)'
        },
        dotGold: {
            width: 8,
            height: 8,
            borderRadius: 99,
            background: '#FFC107',
            boxShadow: '0 0 0 2px rgba(255,193,7,0.25)'
        },
        section: {
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            marginTop: 12
        },
        secHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            cursor: 'pointer',
            userSelect: 'none'
        },
        secTitleWrap: {
            display: 'flex',
            alignItems: 'center',
            gap: 10
        },
        secTitle: {
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: '#EAF2FF'
        },
        secHint: {
            fontSize: '12px',
            color: '#8FA5C6'
        },
        secBody: {
            padding: '14px',
            borderTop: '1px solid rgba(255,255,255,0.08)'
        },
        row: {
            display: 'grid',
            gap: 12
        },
        twoCol: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12
        },
        input: {
            width: '100%',
            padding: 10,
            borderRadius: '10px',
            border: '1px solid rgba(127,179,255,0.25)',
            background: 'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF',
            outline: 'none'
        },
        select: {
            width: '100%',
            padding: 10,
            borderRadius: '10px',
            border: '1px solid rgba(127,179,255,0.25)',
            background: 'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF',
            outline: 'none'
        },
        fieldset: {
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            padding: 12
        },
        legend: {
            padding: '0 6px',
            color: '#C7D3E8'
        },
        checkboxRow: {
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap'
        },
        ctaRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16
        },
        hint: { fontSize: '13px', color: '#88A0BF' },
        btn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)',
            color: '#FFFFFF',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)'
        },
        error: { color: 'crimson', marginTop: 8 }
    };

    const css = [
        '.i{ transition: border-color 160ms ease, box-shadow 160ms ease; }',
        '.i:focus{ box-shadow: 0 0 0 3px rgba(127,179,255,0.35); border-color: rgba(127,179,255,0.6); }',
        '.cta{ transition: transform 160ms ease, box-shadow 160ms ease; }',
        '.cta:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }',
        '.chev{ transition: transform 160ms ease, opacity 160ms ease; }',
        '.rot{ transform: rotate(90deg); }',
        '@media (max-width: 720px){ .two{ grid-template-columns: 1fr; } }'
    ].join('\n');

    function Section({ open, setOpen, title, hint, children, iconColor = '#7FB3FF' }) {
        return (
            <section style={styles.section}>
                <header style={styles.secHeader} onClick={() => setOpen(!open)}>
                    <div style={styles.secTitleWrap}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="7" stroke={iconColor} strokeWidth="1.6" />
                            <path d="M12 7v5l3 2" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        <span style={styles.secTitle}>{title}</span>
                        <span style={styles.secHint}>{hint}</span>
                    </div>
                    <svg className={`chev ${open ? 'rot' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" stroke="#C7D3E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </header>
                {open && <div style={styles.secBody}>{children}</div>}
            </section>
        );
    }

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden="true" />
            <div style={styles.rays} aria-hidden="true" />

            <div style={styles.shell}>
                <section style={styles.card}>
                    <h1 style={styles.h1}>Create Countdown</h1>
                    <p style={styles.sub}>
                        You can create a countdown without signing in. You’ll get the share link (and email reminders if you set one),
                        but <b>you won’t be able to save/manage/edit</b> it later unless you sign in.
                    </p>

                    <div style={styles.stepper}>
                        <span style={styles.stepPill}><span style={styles.dotBlue} />Basics</span>
                        <span style={styles.stepPill}><span style={styles.dotBlue} />Access</span>
                        <span style={styles.stepPill}><span style={styles.dotGold} />Notifications</span>
                        <span style={styles.stepPill}><span style={styles.dotGold} />Audio</span>
                        <span style={styles.stepPill}><span style={styles.dotGold} />Recurrence</span>
                    </div>

                    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                        <Section
                            open={openBasics}
                            setOpen={setOpenBasics}
                            title="Basics"
                            hint="Title, time, timezone, theme"
                            iconColor="#7FB3FF"
                        >
                            <div style={styles.row}>
                                <label>
                                    Title
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        style={{ ...styles.input }}
                                        className="i"
                                        autoFocus
                                    />
                                </label>

                                <div className="two" style={styles.twoCol}>
                                    <label>
                                        Date
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            style={{ ...styles.input }}
                                            className="i"
                                        />
                                    </label>
                                    <label>
                                        Time
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            required
                                            style={{ ...styles.input }}
                                            className="i"
                                        />
                                    </label>
                                </div>

                                <label>
                                    Time Zone (IANA)
                                    <input
                                        value={timeZone}
                                        onChange={(e) => setTimeZone(e.target.value)}
                                        required
                                        style={{ ...styles.input }}
                                        className="i"
                                        placeholder="America/Los_Angeles"
                                    />
                                    <small style={styles.hint}>Detected: {detectTZ()}</small>
                                </label>

                                <label>
                                    Theme
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value)}
                                        style={{ ...styles.select }}
                                        className="i"
                                    >
                                        <option value="default">Default</option>
                                        <option value="birthday">Birthday</option>
                                        <option value="exam">Exam</option>
                                        <option value="launch">Launch</option>
                                        <option value="night">Night</option>
                                    </select>
                                </label>
                            </div>
                        </Section>

                        <Section
                            open={openAccess}
                            setOpen={setOpenAccess}
                            title="Privacy & Access"
                            hint="Public, unlisted, or private with passcode"
                            iconColor="#FFC107"
                        >
                            <fieldset style={styles.fieldset}>
                                <legend style={styles.legend}>Visibility</legend>
                                <div style={styles.checkboxRow}>
                                    <label>
                                        <input
                                            type="radio"
                                            name="vis"
                                            value="PUBLIC"
                                            checked={visibility === 'PUBLIC'}
                                            onChange={() => setVisibility('PUBLIC')}
                                        />{' '}
                                        Public
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="vis"
                                            value="UNLISTED"
                                            checked={visibility === 'UNLISTED'}
                                            onChange={() => setVisibility('UNLISTED')}
                                        />{' '}
                                        Unlisted (no index)
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="vis"
                                            value="PRIVATE"
                                            checked={visibility === 'PRIVATE'}
                                            onChange={() => setVisibility('PRIVATE')}
                                        />{' '}
                                        Private (passcode)
                                    </label>
                                </div>
                                {visibility === 'PRIVATE' && (
                                    <label style={{ display: 'block', marginTop: 8 }}>
                                        Passcode
                                        <input
                                            value={passcode}
                                            onChange={(e) => setPasscode(e.target.value)}
                                            placeholder="4–64 characters"
                                            minLength={4}
                                            maxLength={64}
                                            required
                                            style={{ ...styles.input, marginTop: 4 }}
                                            className="i"
                                        />
                                    </label>
                                )}
                            </fieldset>
                        </Section>

                        <Section
                            open={openNotify}
                            setOpen={setOpenNotify}
                            title="Notifications"
                            hint="Email, Slack, SMS, Discord"
                            iconColor="#7FB3FF"
                        >
                            <fieldset style={styles.fieldset}>
                                <legend style={styles.legend}>Reminder (Email)</legend>
                                <label style={{ display: 'block', marginBottom: 8 }}>
                                    Target email
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={{ ...styles.input, marginTop: 4 }}
                                        className="i"
                                    />
                                </label>
                                <div style={styles.checkboxRow}>
                                    <label><input type="checkbox" checked={rule7} onChange={(e) => setRule7(e.target.checked)} /> 7 days before</label>
                                    <label><input type="checkbox" checked={rule3} onChange={(e) => setRule3(e.target.checked)} /> 3 days before</label>
                                    <label><input type="checkbox" checked={rule1} onChange={(e) => setRule1(e.target.checked)} /> 1 day before</label>
                                    <label><input type="checkbox" checked={rule0} onChange={(e) => setRule0(e.target.checked)} /> Day-of</label>
                                </div>
                                <small style={styles.hint}>Leave email empty if you don’t want reminders.</small>
                            </fieldset>

                            <fieldset style={{ ...styles.fieldset, marginTop: 12 }}>
                                <legend style={styles.legend}>Reminder (Slack)</legend>
                                <label style={{ display: 'block', marginBottom: 8 }}>
                                    Channel Webhook URL
                                    <input
                                        value={slackWebhookUrl}
                                        onChange={(e) => setSlackWebhookUrl(e.target.value)}
                                        placeholder="https://hooks.slack.com/services/..."
                                        style={{ ...styles.input, marginTop: 4 }}
                                        className="i"
                                    />
                                </label>
                                <small style={styles.hint}>Paste an Incoming Webhook URL of your Slack channel.</small>
                            </fieldset>

                            <fieldset style={{ ...styles.fieldset, marginTop: 12 }}>
                                <legend style={styles.legend}>Reminder (SMS)</legend>
                                <label style={{ display: 'block', marginBottom: 8 }}>
                                    Phone number
                                    <input
                                        value={smsPhone}
                                        onChange={(e) => setSmsPhone(e.target.value)}
                                        placeholder="+14155551234"
                                        style={{ ...styles.input, marginTop: 4 }}
                                        className="i"
                                    />
                                </label>
                                <small style={styles.hint}>Use E.164 format. Requires server Twilio credentials.</small>
                            </fieldset>

                            <fieldset style={{ ...styles.fieldset, marginTop: 12 }}>
                                <legend style={styles.legend}>Reminder (Discord)</legend>
                                <label style={{ display: 'block', marginBottom: 8 }}>
                                    Channel Webhook URL
                                    <input
                                        value={discordWebhookUrl}
                                        onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                                        placeholder="https://discord.com/api/webhooks/{id}/{token}"
                                        style={{ ...styles.input, marginTop: 4 }}
                                        className="i"
                                    />
                                </label>
                                <small style={styles.hint}>Paste a Discord Incoming Webhook URL of the target channel.</small>
                            </fieldset>
                        </Section>

                        <Section
                            open={openAudio}
                            setOpen={setOpenAudio}
                            title="Audio"
                            hint="Background music and end sound"
                            iconColor="#FFC107"
                        >
                            <fieldset style={styles.fieldset}>
                                <legend style={styles.legend}>Background music</legend>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <input
                                        placeholder="BGM URL (optional)"
                                        value={bgmUrl}
                                        onChange={(e) => setBgmUrl(e.target.value)}
                                        style={{ ...styles.input }}
                                        className="i"
                                    />
                                    <input type="file" accept="audio/*" onChange={e => setBgmFile(e.target.files?.[0] || null)} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" checked={bgmLoop} onChange={e => setBgmLoop(e.target.checked)} />
                                        Loop
                                    </label>
                                    <label>Volume: {bgmVolume}
                                        <input type="range" min="0" max="100" value={bgmVolume} onChange={e => setBgmVolume(Number(e.target.value))} />
                                    </label>
                                </div>
                            </fieldset>

                            <fieldset style={{ ...styles.fieldset, marginTop: 12 }}>
                                <legend style={styles.legend}>End sound</legend>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <select value={endKey} onChange={e => setEndKey(e.target.value)} style={{ ...styles.select }} className="i">
                                        <option value="none">None</option>
                                        <option value="bell">Bell (built-in)</option>
                                        <option value="chime">Chime (built-in)</option>
                                        <option value="beep">Beep (built-in)</option>
                                        <option value="custom">Custom (URL or upload)</option>
                                    </select>
                                    {endKey === 'custom' && (
                                        <>
                                            <input
                                                placeholder="Custom end sound URL"
                                                value={endUrl}
                                                onChange={(e) => setEndUrl(e.target.value)}
                                                style={{ ...styles.input }}
                                                className="i"
                                            />
                                            <input type="file" accept="audio/*" onChange={e => setEndFile(e.target.files?.[0] || null)} />
                                        </>
                                    )}
                                    <label>Volume: {endVolume}
                                        <input type="range" min="0" max="100" value={endVolume} onChange={e => setEndVolume(Number(e.target.value))} />
                                    </label>
                                </div>
                            </fieldset>
                        </Section>

                        <Section
                            open={openRepeat}
                            setOpen={setOpenRepeat}
                            title="Recurrence"
                            hint="Optional schedule (login required)"
                            iconColor="#7FB3FF"
                        >
                            <fieldset style={styles.fieldset}>
                                <legend style={styles.legend}>Type</legend>
                                <div style={styles.checkboxRow}>
                                    <label><input type="radio" name="rec" checked={recType === 'NONE'} onChange={() => setRecType('NONE')} /> None</label>
                                    <label><input type="radio" name="rec" checked={recType === 'DAILY'} onChange={() => setRecType('DAILY')} /> Daily</label>
                                    <label><input type="radio" name="rec" checked={recType === 'WEEKDAYS'} onChange={() => setRecType('WEEKDAYS')} /> Weekdays</label>
                                    <label><input type="radio" name="rec" checked={recType === 'WEEKLY'} onChange={() => setRecType('WEEKLY')} /> Weekly</label>
                                </div>
                                {recType === 'WEEKLY' && (
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                                        {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(d => (
                                            <label key={d}>
                                                <input
                                                    type="checkbox"
                                                    checked={wk[d]}
                                                    onChange={e => setWk({ ...wk, [d]: e.target.checked })}
                                                /> {d}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <small style={styles.hint}>Anonymous users can't enable recurring. You'll get a login-required error if not signed in.</small>
                            </fieldset>
                        </Section>

                        <div style={styles.ctaRow}>
                            <span style={styles.hint}>Review sections above, then create your countdown.</span>
                            <button
                                className="cta"
                                style={styles.btn}
                                disabled={!canSubmit || submitting}
                                aria-busy={submitting ? 'true' : 'false'}
                            >
                                {submitting ? 'Creating...' : 'Create'}
                            </button>
                        </div>

                        {err && <p style={styles.error}>{err}</p>}
                    </form>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </main>
    );

}