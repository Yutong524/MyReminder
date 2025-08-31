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
                    regenerateJobs: true
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

            <button disabled={submitting || !canSubmit}>{submitting ? 'Saving…' : 'Save changes'}</button>
            {err && <p style={{ color: 'crimson' }}>{err}</p>}
        </form>
    );
}
