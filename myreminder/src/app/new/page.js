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
    const [rule7, setRule7] = useState(true);
    const [rule3, setRule3] = useState(true);
    const [rule1, setRule1] = useState(true);
    const [rule0, setRule0] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState(null);
    const [theme, setTheme] = useState('default');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [passcode, setPasscode] = useState('');

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
            const res = await fetch('/api/moments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    localDateTime,
                    timeZone,
                    theme,
                    email,
                    rules: { seven: rule7, three: rule3, one: rule1, dayOf: rule0 },
                    visibility,
                    passcode: visibility === 'PRIVATE' ? passcode : undefined,
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

    return (
        <main style={{ maxWidth: 560, margin: '40px auto', padding: 16 }}>
            <h1>Create Countdown</h1>
            <p style={{ opacity: .8, margin: "8px 0 16px" }}>
                You can create a countdown without signing in.
                You’ll get the share link (and email reminders if you set one),
                but <b>you won’t be able to save/manage/edit</b> it later unless you sign in.
            </p>

            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <label>
                    Title
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                        autoFocus
                    />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                        Date
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            style={{ width: '100%', padding: 8 }}
                        />
                    </label>
                    <label>
                        Time
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            style={{ width: '100%', padding: 8 }}
                        />
                    </label>
                </div>

                <label>
                    Time Zone (IANA)
                    <input
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                        placeholder="America/Los_Angeles"
                    />
                    <small>Detected: {detectTZ()}</small>
                </label>

                <label>
                    Theme
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                    >
                        <option value="default">Default</option>
                        <option value="birthday">Birthday</option>
                        <option value="exam">Exam</option>
                        <option value="launch">Launch</option>
                        <option value="night">Night</option>
                    </select>
                </label>

                <fieldset style={{ border: '1px solid rgba(0,0,0,0.1)', padding: 12, borderRadius: 8 }}>
                    <legend>Privacy & Access</legend>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
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
                        <label style={{ display: 'block' }}>
                            Passcode
                            <input
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="4–64 characters"
                                minLength={4}
                                maxLength={64}
                                required
                                style={{ width: '100%', padding: 8, marginTop: 4 }}
                            />
                        </label>
                    )}
                </fieldset>

                <fieldset style={{ border: '1px solid rgba(0,0,0,0.1)', padding: 12, borderRadius: 8 }}>
                    <legend>Reminder (Email)</legend>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Target email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            style={{ width: '100%', padding: 8, marginTop: 4 }}
                        />
                    </label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <label><input type="checkbox" checked={rule7} onChange={(e) => setRule7(e.target.checked)} /> 7 days before</label>
                        <label><input type="checkbox" checked={rule3} onChange={(e) => setRule3(e.target.checked)} /> 3 days before</label>
                        <label><input type="checkbox" checked={rule1} onChange={(e) => setRule1(e.target.checked)} /> 1 day before</label>
                        <label><input type="checkbox" checked={rule0} onChange={(e) => setRule0(e.target.checked)} /> Day-of</label>
                    </div>
                    <small style={{ opacity: .75 }}>Leave email empty if you don’t want reminders.</small>
                </fieldset>

                <button
                    disabled={!canSubmit || submitting}
                    aria-busy={submitting ? 'true' : 'false'}
                >
                    {submitting ? 'Creating...' : 'Create'}
                </button>

                {err && <p style={{ color: 'crimson' }}>{err}</p>}
            </form>
        </main>
    );
}
