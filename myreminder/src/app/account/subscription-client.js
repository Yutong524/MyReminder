"use client";
import { useEffect, useState } from "react";

export default function SubscriptionClient() {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");
    const [sub, setSub] = useState(null);

    const styles = {
        row: { display: "grid", gap: 10, marginTop: 10 },
        pill: {
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            color: "#C7D3E8", fontSize: 13
        },
        btn: {
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)",
            color: "#fff", fontWeight: 700,
            boxShadow: "0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
            fontSize: 14
        },
        ghost: {
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            border: "1px solid rgba(255,255,255,0.10)"
        },
        hint: { fontSize: 13, color: "#88A0BF" }
    };

    async function load() {
        setLoading(true);
        setErr("");
        setMsg("");
        try {
            const r = await fetch("/api/billing/subscription", { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Load failed");
            setSub(j);
        } catch (e) {
            setErr(e.message || "Load failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function start(plan) {
        setBusy(true);
        setErr("");
        setMsg("");
        try {
            const r = await fetch(`/api/billing/checkout?plan=${encodeURIComponent(plan)}`, { method: "POST" });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.url) throw new Error(j?.error || "Checkout failed");
            window.location.href = j.url;
        } catch (e) {
            setErr(e.message || "Checkout failed");
        } finally {
            setBusy(false);
        }
    }

    async function portal() {
        setBusy(true);
        setErr("");
        setMsg("");
        try {
            const r = await fetch("/api/billing/portal", { method: "POST" });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.url) throw new Error(j?.error || "Open portal failed");
            window.location.href = j.url;
        } catch (e) {
            setErr(e.message || "Open portal failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            {loading && <div style={styles.hint}>Loading subscription…</div>}
            {err && <div style={{ color: "salmon" }}>{err}</div>}

            {!loading && !sub && (
                <div style={styles.row}>
                    <div style={styles.hint}>No subscription yet.</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button disabled={busy}
                            style={styles.btn} onClick={() => start("monthly")}
                        >
                            Subscribe Monthly
                        </button>
                        <button disabled={busy}
                            style={{ ...styles.btn, ...styles.ghost }} onClick={() => start("yearly")}
                        >
                            Subscribe Yearly
                        </button>
                    </div>
                </div>
            )}

            {!loading && sub && (
                <div style={styles.row}>
                    <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
                    >
                        <span style={styles.pill}>Status: {sub.status || "unknown"}</span>
                        {sub.plan && <span style={styles.pill}>Plan: {sub.plan}</span>}
                        {sub.renewsAt && <span style={styles.pill}>Renews: {new Date(sub.renewsAt).toLocaleString()}</span>}
                        {sub.cancelAtPeriodEnd && <span style={{ ...styles.pill, borderColor: "rgba(255,193,7,0.35)" }}>
                            Cancels at period end
                        </span>}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button disabled={busy}
                            style={styles.btn} onClick={portal}>
                            Open Billing Portal
                        </button>
                        <button disabled={busy}
                            style={{ ...styles.btn, ...styles.ghost }}
                            onClick={() => start("monthly")}>
                            Switch to Monthly
                        </button>
                        <button disabled={busy}
                            style={{ ...styles.btn, ...styles.ghost }}
                            onClick={() => start("yearly")}
                        >
                            Switch to Yearly
                        </button>
                    </div>
                </div>
            )}

            {msg &&
                <p
                    style={{ marginTop: 10, color: "#8BD17C" }}
                >
                    {msg}</p>}
        </div>
    );
}
