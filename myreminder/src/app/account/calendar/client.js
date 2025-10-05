"use client";
import { useEffect, useState } from "react";

export default function CalendarClient() {
    const [enabled, setEnabled] = useState(false);
    const [tz, setTz] = useState("");
    const [include, setInclude] = useState(false);
    const [url, setUrl] = useState(null);
    const [msg, setMsg] = useState("");

    const styles = {
        sec: {
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",
            marginTop: 14
        },
        head: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            fontWeight: 800,
            color: "#EAF2FF"
        },
        body: {
            padding: 14,
            display: "grid",
            gap: 10
        },
        input: {
            width: "100%",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(127,179,255,0.25)",
            background: "rgba(8,12,24,0.7)",
            color: "#EAF2FF",
            outline: "none",
            fontSize: 14
        },
        btn: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg,#0D63E5 0%,#0A4BBB 100%)",
            color: "#fff",
            fontWeight: 700,
            boxShadow: "0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
            fontSize: 14
        },
        ghost: {
            background: "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            border: "1px solid rgba(255,255,255,0.10)"
        },
        hint: {
            fontSize: 12,
            color: "#8FA5C6"
        },
        row: {
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "center"
        }
    };

    useEffect(() => {
        (async () => {
            const r = await fetch("/api/account/ics", { cache: "no-store" });
            const j = await r.json();
            if (r.ok) {
                setEnabled(!!j.enabled);
                setTz(j.timezone || "");
                setInclude(!!j.includeFollowing);
                setUrl(j.url || null);
            }
        })()
    }, []);

    async function save() {
        setMsg("");
        const r = await fetch("/api/account/ics", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled, timezone: tz, includeFollowing: include })
        });
        const j = await r.json();
        if (!r.ok) { setMsg(j?.error || "Save failed"); return; }
        setUrl(j.url || null);
        setMsg("Saved.");
    }

    async function rotate() {
        setMsg("");
        const r = await fetch("/api/account/ics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rotate: true, enabled: true, timezone: tz, includeFollowing: include }) });
        const j = await r.json();
        if (!r.ok) { setMsg(j?.error || "Rotate failed"); return; }
        setEnabled(true); setUrl(j.url || null); setMsg("Token rotated.");
    }

    async function copy(t) {
        try { await navigator.clipboard.writeText(t); setMsg("Copied."); } catch { setMsg("Copy failed."); }
    }

    return (
        <>
            <section style={styles.sec}>
                <div style={styles.head}>ICS subscription</div>
                <div style={styles.body}>
                    <label className="label">
                        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                        <span style={{ marginLeft: 8 }}>Enable private ICS link</span>
                    </label>

                    <div className="row" style={styles.row}>
                        <label style={{ display: "grid", gap: 6 }}>
                            <div className="label" style={styles.hint}>Timezone (IANA, optional)</div>
                            <input style={styles.input} placeholder="e.g. America/Los_Angeles" value={tz} onChange={e => setTz(e.target.value)} />
                        </label>
                        <label>
                            <input type="checkbox" checked={include} onChange={e => setInclude(e.target.checked)} />
                            <span style={{ marginLeft: 8 }}>Include Following</span>
                        </label>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="cta" style={styles.btn} onClick={save}>Save</button>
                        <button className="cta" style={{ ...styles.btn, ...styles.ghost }} onClick={rotate} disabled={!enabled}>Rotate token</button>
                    </div>

                    {enabled && url && (
                        <div style={{ display: "grid", gap: 6 }}>
                            <div className="label" style={styles.hint}>Your ICS URL</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <input style={{ ...styles.input, minWidth: 280, flex: 1 }} readOnly value={url} />
                                <a className="cta" style={{ ...styles.btn, ...styles.ghost }} href={url} target="_blank" rel="noreferrer">Open</a>
                                <button className="cta" style={{ ...styles.btn, ...styles.ghost }} onClick={() => copy(url)}>Copy</button>
                            </div>
                            <div style={styles.hint}>Tip: In Google Calendar → “Other calendars” → “From URL”.</div>
                        </div>
                    )}

                    {msg && <div style={{ color: "#8BD17C" }}>{msg}</div>}
                </div>
            </section>
        </>
    );
}
