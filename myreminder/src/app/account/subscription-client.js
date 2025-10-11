"use client";
import { useEffect, useMemo, useState } from "react";

export default function SubscriptionClient() {
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [msg, setMsg] = useState("");
    const [sub, setSub] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState("monthly");

    const styles = {
        wrap: { display: "grid", gap: 14, marginTop: 8 },

        card: {
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            padding: 12,
        },

        rowFx: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
        col: { display: "grid", gap: 8 },

        pill: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: 12,
        },
        pillDanger: {
            border: "1px solid rgba(255,80,80,0.35)",
            background:
                "linear-gradient(180deg, rgba(255,80,80,0.15), rgba(255,80,80,0.08))",
            color: "#FFD8D8",
        },
        hint: { fontSize: 13, color: "#88A0BF" },
        small: { fontSize: 12, color: "#8FA5C6" },

        btn: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)",
            color: "#fff",
            fontWeight: 700,
            boxShadow:
                "0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
            fontSize: 14,
        },
        ghost: {
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            border: "1px solid rgba(255,255,255,0.10)",
        },

        gridPlans: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: 10,
        },
        planCard: (active) => ({
            borderRadius: 12,
            border: `1px solid ${active ? "rgba(127,179,255,0.35)" : "rgba(255,255,255,0.08)"
                }`,
            background: active
                ? "linear-gradient(180deg, rgba(13,99,229,0.18), rgba(13,99,229,0.10))"
                : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            padding: 12,
        }),

        sk: {
            bar: (w = 200, h = 16) => ({
                width: w,
                height: h,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 6,
            }),
            block: (h = 120) => ({
                height: h,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
            }),
        },

        toastErr: { color: "salmon", marginTop: 8 },
        toastOk: { color: "#8BD17C", marginTop: 8 },
    };

    const css = [
        ".i{ transition: border-color 160ms ease, box-shadow 160ms ease; }",
        ".i:focus{ box-shadow: 0 0 0 3px rgba(127,179,255,0.35); border-color: rgba(127,179,255,0.6); }",
        ".cta{ transition: transform 160ms ease, box-shadow 160ms ease; }",
        ".cta:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }",
    ].join("\n");

    async function load() {
        setLoading(true);
        setErr("");
        setMsg("");
        try {
            const r = await fetch("/api/billing/subscription", { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Load failed");
            setSub(j);
            if (j?.plan === "yearly" || j?.plan === "monthly") {
                setSelectedPlan(j.plan);
            }
        } catch (e) {
            setErr(e.message || "Load failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function getPeriodEnd_ms() {
        const iso =
            sub?.current_period_end || sub?.renewsAt || sub?.currentPeriodEnd;
        if (!iso) return null;
        const t = new Date(iso).getTime();
        return isNaN(t) ? null : t;
    }
    function getTrialEnd_ms() {
        const iso = sub?.trial_end || sub?.trialEnd;
        if (!iso) return null;
        const t = new Date(iso).getTime();
        return isNaN(t) ? null : t;
    }
    function getCancelAtPeriodEnd() {
        return Boolean(sub?.cancel_at_period_end ?? sub?.cancelAtPeriodEnd);
    }
    function daysLeft(msTimestamp) {
        if (!msTimestamp) return null;
        const now = Date.now();
        const diff = msTimestamp - now;
        const days = Math.max(0, Math.ceil(diff / 86400000));
        return days;
    }

    const statusBanner = useMemo(() => {
        if (!sub) return { label: "Free", chip: null };
        const periodEnd = getPeriodEnd_ms();
        const trialEnd = getTrialEnd_ms();

        if (sub.status === "trialing" && trialEnd) {
            const d = daysLeft(trialEnd);
            return { label: "Trial", chip: `${d} day${d === 1 ? "" : "s"} left` };
        }

        if (sub.status === "active" && periodEnd) {
            const d = daysLeft(periodEnd);
            const chip = getCancelAtPeriodEnd()
                ? `Ends in ${d} day${d === 1 ? "" : "s"}`
                : `Renews in ${d} day${d === 1 ? "" : "s"}`;
            return { label: "Active", chip };
        }

        if (sub.status === "canceled" && periodEnd) {
            const d = daysLeft(periodEnd);
            return { label: "Canceled", chip: `Ends in ${d} day${d === 1 ? "" : "s"}` };
        }

        return { label: "Free", chip: null };
    }, [sub]);

    const currentPlanKey = sub?.plan || "free";

    async function start(plan) {
        setBusy(true);
        setErr("");
        setMsg("");
        try {
            const r = await fetch(
                `/api/billing/checkout?plan=${encodeURIComponent(plan)}`,
                { method: "POST" }
            );
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

    if (loading) {
        return (
            <div style={styles.wrap}>
                <section style={styles.card}>
                    <div style={styles.rowFx}>
                        <div style={styles.sk.bar(140, 20)} />
                        <div style={styles.sk.bar(120, 18)} />
                    </div>
                    <div style={{ ...styles.small, marginTop: 8 }}>
                        <div style={styles.sk.bar(220, 12)} />
                    </div>
                </section>

                <section style={styles.card}>
                    <div style={styles.sk.block(120)} />
                </section>

                <section style={styles.card}>
                    <div style={styles.sk.bar(280, 32)} />
                </section>
            </div>
        );
    }

    return (
        <>
            <div style={styles.wrap}>
                <section style={styles.card}>
                    <div style={styles.rowFx}>
                        <span style={styles.pill}>Status: {statusBanner.label}</span>
                        {sub?.plan && <span style={styles.pill}>Plan: {sub.plan}</span>}
                        {statusBanner.chip && <span style={styles.pill}>{statusBanner.chip}</span>}
                        {getCancelAtPeriodEnd() && (
                            <span style={{ ...styles.pill, ...styles.pillDanger }}>
                                Will end at period end
                            </span>
                        )}
                    </div>

                    {sub?.status === "active" && (
                        <p style={{ ...styles.small, marginTop: 8 }}>
                            You are on the <b>{sub.plan === "yearly" ? "Yearly" : "Monthly"}</b> plan.
                        </p>
                    )}
                    {!sub && <p style={{ ...styles.small, marginTop: 8 }}>You are on the Free plan.</p>}
                </section>

                <section style={styles.card}>
                    <div style={styles.gridPlans}>
                        {[
                            {
                                key: "free",
                                name: "Free",
                                price: "$0",
                                perks: ["Basic folders", "Email login", "Community support"],
                                cta: "Current",
                            },
                            {
                                key: "monthly",
                                name: "Monthly",
                                price: "$5",
                                perks: ["Unlimited folders", "2FA", "ICS/WebCal", "Sharing"],
                                cta: "Choose Monthly",
                            },
                            {
                                key: "yearly",
                                name: "Yearly",
                                price: "$48",
                                perks: ["All Monthly perks", "2 months free"],
                                cta: "Choose Yearly",
                            },
                        ].map((p) => {
                            const active = currentPlanKey === p.key || (!sub && p.key === "free");
                            const isSelectable = p.key !== "free";
                            return (
                                <div key={p.key} style={styles.planCard(active)}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <strong>{p.name}</strong>
                                        <span style={styles.small}>{p.price}</span>
                                    </div>
                                    <ul style={{ margin: "8px 0 10px", paddingLeft: 18 }}>
                                        {p.perks.map((it) => (
                                            <li key={it} style={{ fontSize: 13, color: "#C7D3E8" }}>
                                                {it}
                                            </li>
                                        ))}
                                    </ul>
                                    {!isSelectable ? (
                                        <span style={styles.pill}>Current</span>
                                    ) : (
                                        <button
                                            className="cta"
                                            style={{
                                                ...styles.btn,
                                                ...(selectedPlan === p.key ? {} : styles.ghost),
                                            }}
                                            disabled={busy}
                                            onClick={() => setSelectedPlan(p.key)}
                                        >
                                            {selectedPlan === p.key ? "Selected" : p.cta}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p style={{ ...styles.small, marginTop: 8 }}>
                        Features greyed out on Free are unlocked by Monthly/Yearly.
                    </p>
                </section>

                <section style={styles.card}>
                    <div style={styles.rowFx}>
                        <div style={styles.pill}>Plan:</div>
                        <button
                            className="cta"
                            style={{ ...styles.btn, ...(selectedPlan === "monthly" ? {} : styles.ghost) }}
                            disabled={busy}
                            onClick={() => setSelectedPlan("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className="cta"
                            style={{ ...styles.btn, ...(selectedPlan === "yearly" ? {} : styles.ghost) }}
                            disabled={busy}
                            onClick={() => setSelectedPlan("yearly")}
                        >
                            Yearly
                        </button>
                        <div style={{ flex: 1 }} />
                        <button
                            className="cta"
                            style={styles.btn}
                            disabled={busy}
                            onClick={() => start(selectedPlan)}
                            title="Proceed to Stripe checkout"
                        >
                            {busy ? "Working…" : `Continue with ${selectedPlan}`}
                        </button>
                    </div>
                    <p style={{ ...styles.small, marginTop: 8 }}>
                        Switching now prorates on Stripe. You can change or cancel anytime.
                    </p>
                    {!!err && <p style={styles.toastErr}>{err}</p>}
                    {!!msg && <p style={styles.toastOk}>{msg}</p>}
                </section>

                <section style={styles.card}>
                    <div className="row" style={styles.rowFx}>
                        <button className="cta" style={{ ...styles.btn, ...styles.ghost }} onClick={portal} disabled={busy}>
                            Open billing portal
                        </button>
                        {sub?.status === "active" && !getCancelAtPeriodEnd() && (
                            <span style={styles.small}>
                                Want to cancel at period end? Use the billing portal to set it safely.
                            </span>
                        )}
                        {getCancelAtPeriodEnd() && (
                            <span style={{ ...styles.small, color: "#FFD8D8" }}>
                                Your subscription will end at the period end. You can resume in the portal before it ends.
                            </span>
                        )}
                    </div>
                </section>

                {!sub && err && (
                    <section style={{ ...styles.card, borderColor: "rgba(255,80,80,0.35)" }}>
                        <div style={{ color: "salmon" }}>{err}</div>
                        <div style={{ marginTop: 8 }}>
                            <button
                                className="cta"
                                style={{ ...styles.btn, ...styles.ghost }}
                                disabled={busy}
                                onClick={load}
                            >
                                Retry
                            </button>
                        </div>
                    </section>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </>
    );
}
