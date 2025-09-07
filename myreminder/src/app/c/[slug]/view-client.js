'use client';

import { useEffect, useState } from 'react';

function pad(n) {
    return String(n).padStart(2, '0');
}

export default function Countdown({ targetIso, audio }) {
    const [diff, setDiff] = useState(() => new Date(targetIso).getTime() - Date.now());
    const [soundReady, setSoundReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [endedOnce, setEndedOnce] = useState(false);
    const [bgm, setBgm] = useState(null);
    const [endS, setEndS] = useState(null);

    useEffect(() => {
        const id = setInterval(() => setDiff(new Date(targetIso).getTime() - Date.now()), 1000);
        return () => clearInterval(id);
    }, [targetIso]);

    useEffect(() => {
        if (!audio) return;
        const created = [];
        if (audio.bgmUrl) {
            const el = new Audio(audio.bgmUrl);
            el.loop = !!audio.bgmLoop;
            el.preload = "auto";
            el.volume = (audio.bgmVolume ?? 50) / 100;
            setBgm(el);
            created.push(el);
        }
        if (audio.endUrl) {
            const el = new Audio(audio.endUrl);
            el.preload = "auto";
            el.volume = (audio.endVolume ?? 80) / 100;
            setEndS(el);
            created.push(el);
        }
        setSoundReady(true);
        return () => {
            created.forEach((x) => {
                try { x.pause(); } catch { }
            });
        };
    }, [audio && audio.bgmUrl, audio && audio.endUrl]);

    async function startSound() {
        try {
            if (bgm && !playing) {
                await bgm.play();
            }
            setPlaying(true);
            if (typeof window !== "undefined") {
                localStorage.setItem(`sound:${targetIso}`, "on");
            }
        } catch { }
    }

    function stopSound() {
        try { bgm && bgm.pause(); } catch { }
        setPlaying(false);
        if (typeof window !== "undefined") {
            localStorage.removeItem(`sound:${targetIso}`);
        }
    }

    useEffect(() => {
        if (!soundReady) return;
        try {
            if (localStorage.getItem(`sound:${targetIso}`) === "on") {
                startSound();
            }
        } catch { }
    }, [soundReady]);

    if (diff <= 0) {
        if (!endedOnce) {
            setEndedOnce(true);
            try { if (endS) { endS.currentTime = 0; endS.play(); } } catch { }
            try { if (bgm && playing) bgm.pause(); } catch { }
        }
        return (
            <div style={{ display: "grid", gap: 12 }}>
                <h2>It’s time! 🎉</h2>
                {audio && (audio.bgmUrl || audio.endUrl) && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {!playing ? (
                            <button onClick={startSound}>🔊 Play sound</button>
                        ) : (
                            <button onClick={stopSound}>🔇 Stop</button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    const total = Math.floor(diff / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div
                style={{
                    fontSize: 32,
                    fontFamily: "ui-monospace, Menlo, Consolas",
                    display: "flex",
                    gap: 12,
                }}
            >
                <span>{d}d</span>
                <span>{pad(h)}h</span>
                <span>{pad(m)}m</span>
                <span>{pad(s)}s</span>
            </div>
            {audio && (audio.bgmUrl || audio.endUrl) && (
                <div style={{ display: "flex", gap: 8 }}>
                    {!playing ? (
                        <button onClick={startSound}>🔊 Play sound</button>
                    ) : (
                        <button onClick={stopSound}>🔇 Stop</button>
                    )}
                </div>
            )}
        </div>
    );
}
