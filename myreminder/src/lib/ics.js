export function buildICS({ prodId = "-//MyReminder//ICS 1.0//EN", events = [] }) {
    const esc = (s = '') => String(s)
        .replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

    const dtstamp = toICSDate(new Date());

    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        `PRODID:${prodId}`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ];

    for (const ev of events) {
        const uid = ev.uid || `${Math.random().toString(36).slice(2)}@myreminder`;
        const start = toICSDate(ev.start);
        const end = toICSDate(ev.end || ev.start);
        lines.push(
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${esc(ev.summary || "Reminder")}`,
            ev.url ? `URL:${esc(ev.url)}` : null,
            ev.description ? `DESCRIPTION:${esc(ev.description)}` : null,
            "END:VEVENT"
        ).filter(Boolean);
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
}

function toICSDate(d) {
    const x = (d instanceof Date) ? d : new Date(d);
    return (
        x.getUTCFullYear().toString().padStart(4, "0") +
        (x.getUTCMonth() + 1).toString().padStart(2, "0") +
        x.getUTCDate().toString().padStart(2, "0") + "T" +
        x.getUTCHours().toString().padStart(2, "0") +
        x.getUTCMinutes().toString().padStart(2, "0") +
        x.getUTCSeconds().toString().padStart(2, "0") + "Z"
    );
}
