import { fromZonedTime } from "date-fns-tz";

const DOW = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function rruleFromInput(rec) {
    if (!rec || !rec.type || rec.type === 'NONE') return null;
    if (rec.type === 'DAILY') return 'FREQ=DAILY';
    if (rec.type === 'WEEKDAYS') return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
    if (rec.type === 'WEEKLY') {
        const days = (rec.days || []).filter(Boolean);
        if (!days.length) return null;
        return `FREQ=WEEKLY;BYDAY=${days.join(',')}`;
    }
    return null;
}

function parseByDay(rrule) {
    const m = /BYDAY=([A-Z,]+)/.exec(rrule || '');
    if (!m) return null;
    return m[1].split(',');
}

export function nextOccurrenceUtc({ fromUtc, rrule, rtime, timeZone }) {
    if (!rrule || !rtime) return null;
    const [hh, mm] = rtime.split(':').map(n => parseInt(n, 10));
    const base = new Date(fromUtc.getTime() + 1000);

    for (let i = 0; i < 14; i++) {
        const d = new Date(base.getTime());
        d.setUTCDate(d.getUTCDate() + i);
        const localISO = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm))
            .toISOString().slice(0, 16);
        const candidate = fromZonedTime(localISO, timeZone);
        const need = rrule.includes('FREQ=DAILY') ? null : parseByDay(rrule);
        if (need) {
            const dow = DOW[candidate.getUTCDay()];
            if (!need.includes(dow)) continue;
        }
        if (candidate > base) return candidate;
    }
    return null;
}
