'use client';

import { useEffect, useState } from 'react';

function pad(n) {
    return String(n).padStart(2, '0');
}

export default function Countdown({ targetIso }) {
    const [diff, setDiff] = useState(() => new Date(targetIso).getTime() - Date.now());

    useEffect(() => {
        const id = setInterval(() => setDiff(new Date(targetIso).getTime() - Date.now()), 1000);
        return () => clearInterval(id);
    }, [targetIso]);

    if (diff <= 0) return <h2>It’s time! 🎉</h2>;

    const total = Math.floor(diff / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    return (
        <div style={{ fontSize: 32, fontFamily: 'ui-monospace, Menlo, Consolas', display: 'flex', gap: 12 }}>
            <span>{d}d</span><span>{pad(h)}h</span><span>{pad(m)}m</span><span>{pad(s)}s</span>
        </div>
    );
}
