'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function EditForm({ slug, initial }) {
    const router = useRouter();
    const [title, setTitle] = useState(initial.title);
    const [timeZone, setTimeZone] = useState(initial.timeZone);
    const [theme, setTheme] = useState(initial.theme);
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
    const [recType, setRecType] = useState(initial.recurrence.type || 'NONE');
    const [wk, setWk] = useState(() => {
        const obj = { MO: false, TU: false, WE: false, TH: false, FR: false, SA: false, SU: false };
        (initial.recurrence.days || []).forEach(d => obj[d] = true);
        return obj;
    });
    const [err, setErr] = useState(null);

    const localDateTime = useMemo(() => (date && time ? `${date}T${time}` : ''), [date, time]);
    const canSubmit = !!(title.trim() && localDateTime && timeZone && (visibility !== 'PRIVATE' || passcode.trim().length >= 0));

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

    return (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>

            <fieldset style={{ border: '1px solid rgba(0,0,0,.1)', padding: 12, borderRadius: 8 }}>
                <legend>Recurring</legend>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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

            <label>Title
                <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>Date
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                </label>
                <label>Time
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                </label>
            </div>

            <label>Time Zone (IANA)
                <input value={timeZone} onChange={e => setTimeZone(e.target.value)} required style={{ width: '100%', padding: 8 }} />
            </label>

            <label>Theme
                <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: '100%', padding: 8 }}>
                    <option value="default">Default</option>
                    <option value="birthday">Birthday</option>
                    <option value="exam">Exam</option>
                    <option value="launch">Launch</option>
                    <option value="night">Night</option>
                </select>
            </label>

            <fieldset style={{ border: '1px solid rgba(0,0,0,.1)', padding: 12, borderRadius: 8 }}>
                <legend>Privacy & Access</legend>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <label><input type="radio" name="vis" checked={visibility === 'PUBLIC'} onChange={() => setVisibility('PUBLIC')} /> Public</label>
                    <label><input type="radio" name="vis" checked={visibility === 'UNLISTED'} onChange={() => setVisibility('UNLISTED')} /> Unlisted</label>
                    <label><input type="radio" name="vis" checked={visibility === 'PRIVATE'} onChange={() => setVisibility('PRIVATE')} /> Private</label>
                </div>
                {visibility === 'PRIVATE' && (
                    <label>Passcode
                        <input value={passcode} onChange={e => setPasscode(e.target.value)} placeholder="leave blank to keep current" style={{ width: '100%', padding: 8 }} />
                    </label>
                )}
            </fieldset>

            <fieldset style={{ border: '1px solid rgba(0,0,0,.1)', padding: 12, borderRadius: 8 }}>
                <legend>Reminder (Email)</legend>
                <label>Target email
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: 8, marginTop: 4 }} />
                </label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <label><input type="checkbox" checked={rule7} onChange={e => setRule7(e.target.checked)} /> 7 days before</label>
                    <label><input type="checkbox" checked={rule3} onChange={e => setRule3(e.target.checked)} /> 3 days before</label>
                    <label><input type="checkbox" checked={rule1} onChange={e => setRule1(e.target.checked)} /> 1 day before</label>
                    <label><input type="checkbox" checked={rule0} onChange={e => setRule0(e.target.checked)} /> Day-of</label>
                </div>
                <small style={{ opacity: .75 }}>Leave email empty to disable email reminders.</small>
            </fieldset>

            <fieldset style={{ border: '1px solid rgba(0,0,0,.1)', padding: 12, borderRadius: 8 }}>
                <legend>Owner notifications</legend>
                <label style={{ display: 'block' }}>
                    <input type="checkbox" checked={notifyCheer} onChange={e => setNotifyCheer(e.target.checked)} />
                    {' '}Email me when someone cheers
                </label>
                <label style={{ display: 'block', marginTop: 6 }}>
                    <input type="checkbox" checked={notifyNote} onChange={e => setNotifyNote(e.target.checked)} />
                    {' '}Email me on new guestbook note
                </label>
                <small style={{ opacity: .7 }}>Requires a valid email set above.</small>
            </fieldset>

            <button disabled={submitting || !canSubmit}>{submitting ? 'Saving…' : 'Save changes'}</button>
            {err && <p style={{ color: 'crimson' }}>{err}</p>}
        </form>
    );
}
