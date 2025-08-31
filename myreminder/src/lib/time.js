import { fromZonedTime } from "date-fns-tz";

export function localToUtc(localISO, timeZone) {
    return fromZonedTime(localISO, timeZone);
}

export function humanizeRemaining(targetIso) {
    const ms = new Date(targetIso).getTime() - Date.now();
    if (ms <= 0) return 'started';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function formatInIana(utcIso, timeZone, opts = {}) {
    const d = new Date(utcIso);
    const fmt = new Intl.DateTimeFormat(opts.locale || 'en-US', {
        dateStyle: opts.dateStyle || 'full',
        timeStyle: opts.timeStyle || 'short',
        timeZone,
        ...opts,
    });
    return fmt.format(d);
}


export function formatInLocal(utcIso, opts = {}) {
    const d = new Date(utcIso);
    const fmt = new Intl.DateTimeFormat(opts.locale || 'en-US', {
        dateStyle: opts.dateStyle || 'full',
        timeStyle: opts.timeStyle || 'short',
        ...opts,
    });
    return fmt.format(d);
}