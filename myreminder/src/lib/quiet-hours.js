export function toMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    return h * 60 + min;
}

export function isWithinQuietHours(date, {
    quietStartMin,
    quietEndMin,
    quietDays
}) {
    if (quietStartMin == null || quietEndMin == null) return false;
    const d = new Date(date);
    const weekday = d.getUTCDay();
    if (Array.isArray(quietDays) && quietDays.length > 0 && !quietDays.includes(weekday)) {
        return false;
    }
    const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();

    if (quietStartMin <= quietEndMin) {
        return minutes >= quietStartMin && minutes < quietEndMin;
    } else {
        return minutes >= quietStartMin || minutes < quietEndMin;
    }
}

export function nextAllowedSendTime(from, opts) {
    if (!isWithinQuietHours(from, opts)) return new Date(from);
    const d = new Date(from);

    const { quietStartMin, quietEndMin } = opts;
    if (quietStartMin != null && quietEndMin != null) {
        const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
        if (quietStartMin <= quietEndMin) {
            if (minutes < quietEndMin) {
                const target = new Date(d);
                target.setUTCHours(0, quietEndMin, 0, 0);
                return target;
            }
        }
    }

    let i = 0;
    let probe = new Date(d);
    while (i < 8 && isWithinQuietHours(probe, opts)) {
        probe = new Date(probe.getTime() + 60 * 1000);
        i++;
    }
    return probe;
}

export function buildIdempotencyKey({
    momentId,
    channel,
    occurrenceUtc
}) {
    const iso = typeof occurrenceUtc === "string" ? occurrenceUtc : new Date(occurrenceUtc).toISOString();
    return `${momentId}:${channel}:${iso}`;
}
