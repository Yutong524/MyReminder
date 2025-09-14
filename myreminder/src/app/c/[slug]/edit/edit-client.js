'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function EditForm({ slug, initial }) {
    const router = useRouter();
    const [title, setTitle] = useState(initial.title);
    const [timeZone, setTimeZone] = useState(initial.timeZone);
    const [theme, setTheme] = useState(initial.theme);

    const [bgImageUrl, setBgImageUrl] = useState(initial.bgImageUrl || '');
    const [bgSize, setBgSize] = useState(initial.bgSize || 'cover');
    const [bgPosition, setBgPosition] = useState(initial.bgPosition || 'center');
    const [bgOpacity, setBgOpacity] = useState(initial.bgOpacity ?? 100);
    const [bgBlend, setBgBlend] = useState(initial.bgBlend || 'normal');
    const [titleColor, setTitleColor] = useState(initial.titleColor || '#ffffff');
    const [timeColor, setTimeColor] = useState(initial.timeColor || '#ffffff');
    const [filters, setFilters] = useState({
        blur: initial.bgFilters?.blur || 0,
        brightness: initial.bgFilters?.brightness ?? 100,
        contrast: initial.bgFilters?.contrast ?? 100,
        grayscale: initial.bgFilters?.grayscale || 0,
        sepia: initial.bgFilters?.sepia || 0,
    });

    const [visibility, setVisibility] = useState(initial.visibility);
    const [passcode, setPasscode] = useState('');
    const [email, setEmail] = useState(initial.email);
    const [date, setDate] = useState(initial.localDate);
    const [time, setTime] = useState(initial.localTime);
    const [rule7, setRule7] = useState(initial.rules.seven);
    const [rule3, setRule3] = useState(initial.rules.three);
    const [rule1, setRule1] = useState(initial.rules.one);
    const [rule0, setRule0] = useState(initial.rules.dayOf);
    const [submitting, setSubmitting] = useState(false);
    const [notifyCheer, setNotifyCheer] = useState(initial.notifyOnCheer || false);
    const [notifyNote, setNotifyNote] = useState(initial.notifyOnNote || false);

    const recur = initial.recurrence || { type: 'NONE', days: [] };
    const [recType, setRecType] = useState(recur.type || 'NONE');
    const [wk, setWk] = useState(() => {
        const obj = { MO: false, TU: false, WE: false, TH: false, FR: false, SA: false, SU: false };
        (recur.days || []).forEach(d => obj[d] = true);
        return obj;
    });

    const [err, setErr] = useState(null);

    const [openBasics, setOpenBasics] = useState(true);
    const [openAccess, setOpenAccess] = useState(true);
    const [openNotify, setOpenNotify] = useState(false);
    const [openBackground, setOpenBackground] = useState(false);
    const [openRepeat, setOpenRepeat] = useState(false);

    const localDateTime = useMemo(() => (date && time ? `${date}T${time}` : ''), [date, time]);
    const canSubmit = !!(title.trim() && localDateTime && timeZone && (visibility !== 'PRIVATE' || passcode.trim().length >= 4));

    async function uploadFile(file) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Upload failed');
        return json.url;
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!canSubmit || submitting) return;
        setErr(null); setSubmitting(true);
        try {
            const res = await fetch(`/api/moments/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    localDateTime,
                    timeZone,
                    theme,
                    visibility,
                    passcode: visibility === 'PRIVATE' ? passcode : undefined,
                    email,
                    rules: { seven: rule7, three: rule3, one: rule1, dayOf: rule0 },
                    regenerateJobs: true,
                    notifyOnCheer: notifyCheer,
                    notifyOnNote: notifyNote,
                    recurrence: recType === 'NONE' ? undefined : {
                        type: recType,
                        days: recType === 'WEEKLY' ? Object.entries(wk).filter(([, v]) => v).map(([k]) => k) : undefined
                    }
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Update failed');
            router.push(`/c/${slug}`);
        } catch (e) { setErr(e.message || 'Update failed'); }
        finally { setSubmitting(false); }
    }

    const styles = {
        shell: { maxWidth: 760, margin: '32px auto', padding: 16 },
        card: {
            position: 'relative',
            borderRadius: '20px',
            background: 'linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '22px',
            color: '#EAF2FF',
            backdropFilter: 'blur(10px)'
        },
        h1: {
            margin: 0,
            fontSize: 'clamp(24px, 4vw, 32px)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            backgroundImage: 'linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
        },
        sub: { marginTop: 6, marginBottom: 14, color: '#B9C6DD', fontSize: '14px' },
        stepper: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
        stepPill: {
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 32, padding: '0 12px',
            borderRadius: '999px', border: '1px solid rgba(255,255,255,0.10)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            color: '#C7D3E8', fontSize: '12px'
        },
        dotBlue: { width: 8, height: 8, borderRadius: 99, background: '#0D63E5', boxShadow: '0 0 0 2px rgba(13,99,229,0.25)' },
        dotGold: { width: 8, height: 8, borderRadius: 99, background: '#FFC107', boxShadow: '0 0 0 2px rgba(255,193,7,0.25)' },

        section: { borderRadius: '14px', border: '1px solid rgba(255,255,255,0.10)', background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', marginTop: 12 },
        secHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer', userSelect: 'none' },
        secTitleWrap: { display: 'flex', alignItems: 'center', gap: 10 },
        secTitle: { fontSize: '14px', fontWeight: 600, letterSpacing: '0.01em', color: '#EAF2FF' },
        secHint: { fontSize: '12px', color: '#8FA5C6' },
        secBody: { padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' },

        row: { display: 'grid', gap: 12 },
        twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },

        input: {
            width: '100%', padding: 10, borderRadius: '10px',
            border: '1px solid rgba(127,179,255,0.25)',
            background: 'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF', outline: 'none'
        },
        select: {
            width: '100%', padding: 10, borderRadius: '10px',
            border: '1px solid rgba(127,179,255,0.25)',
            background: 'linear-gradient(180deg, rgba(8,12,24,0.8), rgba(9,11,19,0.8))',
            color: '#EAF2FF', outline: 'none'
        },
        fieldset: { border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', padding: 12 },
        legend: { padding: '0 6px', color: '#C7D3E8' },
        checkboxRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },

        ctaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
        hint: { fontSize: '13px', color: '#88A0BF' },
        btn: {
            display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none',
            padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.14)',
            background: 'linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)', color: '#FFFFFF',
            fontWeight: 600, letterSpacing: '0.01em', boxShadow: '0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)'
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
        <div style={styles.shell}>
            <section style={styles.card}>
                <h1 style={styles.h1}>Edit Countdown</h1>
                <p style={styles.sub}>
                    Editing <a href={`/c/${slug}`} style={{ color: '#7FB3FF', textDecoration: 'none' }}>/c/{slug}</a>. Changes are saved to your existing link.
                </p>

                <div style={styles.stepper}>
                    <span style={styles.stepPill}><span style={styles.dotBlue} />Basics</span>
                    <span style={styles.stepPill}><span style={styles.dotBlue} />Access</span>
                    <span style={styles.stepPill}><span style={styles.dotGold} />Email & Owner</span>
                    <span style={styles.stepPill}><span style={styles.dotGold} />Background</span>
                    <span style={styles.stepPill}><span style={styles.dotGold} />Recurrence</span>
                </div>

                <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                    <Section
                        open={openBasics}
                        setOpen={setOpenBasics}
                        title="Basics"
                        hint="Title, date, time, timezone, theme"
                        iconColor="#7FB3FF"
                    >
                        <div style={styles.row}>
                            <label>
                                Title
                                <input value={title} onChange={e => setTitle(e.target.value)} required style={{ ...styles.input }} className="i" />
                            </label>

                            <div className="two" style={styles.twoCol}>
                                <label>
                                    Date
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ ...styles.input }} className="i" />
                                </label>
                                <label>
                                    Time
                                    <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={{ ...styles.input }} className="i" />
                                </label>
                            </div>

                            <label>
                                Time Zone (IANA)
                                <input value={timeZone} onChange={e => setTimeZone(e.target.value)} required style={{ ...styles.input }} className="i" />
                            </label>

                            <label>
                                Theme
                                <select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...styles.select }} className="i">
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
                                <label><input type="radio" name="vis" checked={visibility === 'PUBLIC'} onChange={() => setVisibility('PUBLIC')} /> Public</label>
                                <label><input type="radio" name="vis" checked={visibility === 'UNLISTED'} onChange={() => setVisibility('UNLISTED')} /> Unlisted</label>
                                <label><input type="radio" name="vis" checked={visibility === 'PRIVATE'} onChange={() => setVisibility('PRIVATE')} /> Private</label>
                            </div>
                            {visibility === 'PRIVATE' && (
                                <label style={{ display: 'block', marginTop: 8 }}>
                                    Passcode
                                    <input value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="leave blank to keep current" style={{ ...styles.input, marginTop: 4 }} className="i" />
                                </label>
                            )}
                        </fieldset>
                    </Section>

                    <Section
                        open={openNotify}
                        setOpen={setOpenNotify}
                        title="Email & Owner notifications"
                        hint="Event reminders and owner alerts"
                        iconColor="#7FB3FF"
                    >
                        <fieldset style={styles.fieldset}>
                            <legend style={styles.legend}>Reminder (Email)</legend>
                            <label style={{ display: 'block', marginBottom: 8 }}>
                                Target email
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...styles.input, marginTop: 4 }} className="i" />
                            </label>
                            <div style={styles.checkboxRow}>
                                <label><input type="checkbox" checked={rule7} onChange={e => setRule7(e.target.checked)} /> 7 days before</label>
                                <label><input type="checkbox" checked={rule3} onChange={e => setRule3(e.target.checked)} /> 3 days before</label>
                                <label><input type="checkbox" checked={rule1} onChange={e => setRule1(e.target.checked)} /> 1 day before</label>
                                <label><input type="checkbox" checked={rule0} onChange={e => setRule0(e.target.checked)} /> Day-of</label>
                            </div>
                            <small style={styles.hint}>Leave email empty to disable email reminders.</small>
                        </fieldset>

                        <fieldset style={{ ...styles.fieldset, marginTop: 12 }}>
                            <legend style={styles.legend}>Owner notifications</legend>
                            <label style={{ display: 'block' }}>
                                <input type="checkbox" checked={notifyCheer} onChange={e => setNotifyCheer(e.target.checked)} />{' '}Email me when someone cheers
                            </label>
                            <label style={{ display: 'block', marginTop: 6 }}>
                                <input type="checkbox" checked={notifyNote} onChange={e => setNotifyNote(e.target.checked)} />{' '}Email me on new guestbook note
                            </label>
                            <small style={{ opacity: .7 }}>Requires a valid email set above.</small>
                        </fieldset>
                    </Section>

                    <Section
                        open={openBackground}
                        setOpen={setOpenBackground}
                        title="Background image & Filters"
                        hint="Upload, position, blend, color & filters"
                        iconColor="#FFC107"
                    >
                        <fieldset style={styles.fieldset}>
                            <legend style={styles.legend}>Background image</legend>
                            <div style={{ display: 'grid', gap: 10 }}>
                                <div>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={async (e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                const url = await uploadFile(f);
                                                setBgImageUrl(url);
                                            }
                                        }}
                                    />
                                    {bgImageUrl && (
                                        <div style={{ marginTop: 8 }}>
                                            <img src={bgImageUrl} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
                                        </div>
                                    )}
                                </div>

                                <div className="two" style={{ ...styles.twoCol, gridTemplateColumns: '1fr 1fr' }}>
                                    <label>
                                        Size
                                        <select value={bgSize} onChange={e => setBgSize(e.target.value)} style={{ ...styles.select }} className="i">
                                            <option value="cover">cover</option>
                                            <option value="contain">contain</option>
                                            <option value="auto">auto</option>
                                        </select>
                                    </label>
                                    <label>
                                        Position
                                        <input value={bgPosition} onChange={e => setBgPosition(e.target.value)} placeholder="center / 50% 50%" style={{ ...styles.input }} className="i" />
                                    </label>
                                </div>

                                <label>
                                    Opacity: {bgOpacity}%
                                    <input type="range" min="0" max="100" value={bgOpacity} onChange={e => setBgOpacity(+e.target.value)} />
                                </label>

                                <label>
                                    Blend mode
                                    <select value={bgBlend} onChange={e => setBgBlend(e.target.value)} style={{ ...styles.select }} className="i">
                                        <option>normal</option><option>multiply</option><option>screen</option>
                                        <option>overlay</option><option>darken</option><option>lighten</option>
                                    </select>
                                </label>

                                <div className="two" style={{ ...styles.twoCol, gridTemplateColumns: '1fr 1fr' }}>
                                    <label>Title color <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)} /></label>
                                    <label>Time color  <input type="color" value={timeColor} onChange={e => setTimeColor(e.target.value)} /></label>
                                </div>

                                <details>
                                    <summary>Filters</summary>
                                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                                        <label>Blur: {filters.blur}px
                                            <input type="range" min="0" max="20" value={filters.blur} onChange={e => setFilters({ ...filters, blur: +e.target.value })} />
                                        </label>
                                        <label>Brightness: {filters.brightness}%
                                            <input type="range" min="50" max="150" value={filters.brightness} onChange={e => setFilters({ ...filters, brightness: +e.target.value })} />
                                        </label>
                                        <label>Contrast: {filters.contrast}%
                                            <input type="range" min="50" max="150" value={filters.contrast} onChange={e => setFilters({ ...filters, contrast: +e.target.value })} />
                                        </label>
                                        <label>Grayscale: {filters.grayscale}%
                                            <input type="range" min="0" max="100" value={filters.grayscale} onChange={e => setFilters({ ...filters, grayscale: +e.target.value })} />
                                        </label>
                                        <label>Sepia: {filters.sepia}%
                                            <input type="range" min="0" max="100" value={filters.sepia} onChange={e => setFilters({ ...filters, sepia: +e.target.value })} />
                                        </label>
                                    </div>
                                </details>
                            </div>
                        </fieldset>
                    </Section>

                    <Section
                        open={openRepeat}
                        setOpen={setOpenRepeat}
                        title="Recurrence"
                        hint="Schedule options and quick actions"
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
                                        <label key={d}><input type="checkbox" checked={wk[d]} onChange={e => setWk({ ...wk, [d]: e.target.checked })} /> {d}</label>
                                    ))}
                                </div>
                            )}

                            <small style={{ opacity: .75 }}>Current streak: {initial.streak.current} · Best: {initial.streak.max}</small>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button type="button" onClick={async () => {
                                    await fetch(`/api/moments/${slug}/recurring/skip`, { method: 'POST' });
                                    alert('Next occurrence will be skipped.');
                                }}>Skip next</button>
                                <button type="button" onClick={async () => {
                                    const r = await fetch(`/api/moments/${slug}/recurring/done`, { method: 'POST' });
                                    if (r.ok) alert('Marked done and rolled to next.');
                                    else alert('Failed to mark done.');
                                }}>Mark done</button>
                            </div>
                        </fieldset>
                    </Section>

                    <div style={styles.ctaRow}>
                        <span style={styles.hint}>Review changes, then save.</span>
                        <button className="cta" style={styles.btn} disabled={submitting || !canSubmit} aria-busy={submitting ? 'true' : 'false'}>
                            {submitting ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>

                    {err && <p style={styles.error}>{err}</p>}
                </form>
            </section>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </div>
    );
}
