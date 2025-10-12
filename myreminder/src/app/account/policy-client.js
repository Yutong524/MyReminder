"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function PolicyClient() {
    const [tab, setTab] = useState("subscription");
    const [mounted, setMounted] = useState(false);
    const [font, setFont] = useState(14);
    const [readerWide, setReaderWide] = useState(false);
    const [search, setSearch] = useState("");
    const [copied, setCopied] = useState(false);
    const searchRef = useRef(null);

    const SUBSCRIPTION_MD_FALLBACK = `# Subscription Policy\n\nContent will be published soon.`;
    const TERMS_MD_FALLBACK = `# Terms of Use\n\nContent will be published soon.`;
    const [subMd, setSubMd] = useState("");
    const [termsMd, setTermsMd] = useState("");
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [loadErr, setLoadErr] = useState("");

    const styles = {
        wrap: { display: "grid", gap: 12 },
        tabsBar: {
            display: "flex",
            gap: 8,
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            paddingBottom: 8,
            flexWrap: "wrap",
            alignItems: "center",
        },
        tab: (active) => ({
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid ${active ? "rgba(127,179,255,0.35)" : "rgba(255,255,255,0.10)"
                }`,
            background: active
                ? "linear-gradient(180deg, rgba(13,99,229,0.18), rgba(13,99,229,0.10))"
                : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: active ? "#FFFFFF" : "#C7D3E8",
            fontWeight: 700,
            cursor: "pointer",
        }),
        ghostBtn: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontWeight: 600,
            textDecoration: "none",
        },
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
        hint: { fontSize: 13, color: "#88A0BF" },
        metaRow: {
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
        },

        shell: (wide) => ({
            display: "grid",
            gap: 12,
            gridTemplateColumns: wide ? "260px 1fr" : "1fr",
        }),
        tocCard: {
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            padding: 12,
            position: "sticky",
            top: 12,
            height: "fit-content",
        },
        tocTitle: { fontWeight: 800, marginBottom: 6, color: "#EAF2FF" },
        tocItem: (d, active) => ({
            display: "block",
            padding: "6px 8px",
            marginLeft: d * 10,
            borderRadius: 8,
            fontSize: 13,
            color: active ? "#FFFFFF" : "#C7D3E8",
            background: active
                ? "linear-gradient(180deg, rgba(13,99,229,0.18), rgba(13,99,229,0.08))"
                : "transparent",
            textDecoration: "none",
            border: "1px solid transparent",
        }),

        card: {
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            padding: 14,
        },
        titleRow: {
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
        },
        title: { fontWeight: 800, color: "#EAF2FF", fontSize: 18, marginBottom: 6 },
        actions: { display: "flex", gap: 8, flexWrap: "wrap" },
        searchBox: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 10,
            border: "1px solid rgba(127,179,255,0.25)",
            background: "rgba(8,12,24,0.7)",
            padding: "6px 8px",
        },
        input: {
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#EAF2FF",
            fontSize: 13,
            width: 200,
        },
        doc: (fz) => ({
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#C7D3E8",
            fontSize: fz,
            lineHeight: 1.65,
        }),
        smallRow: {
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 8,
        },
        skBar: (w = 180, h = 16) => ({
            width: w,
            height: h,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 6,
        }),
        skBlock: (h = 160) => ({
            height: h,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
        }),
    };

    const css = [
        ".cta{ transition: transform 160ms ease, box-shadow 160ms ease; }",
        ".cta:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }",
        ".i{ transition: border-color 160ms ease, box-shadow 160ms ease; }",
        ".i:focus{ box-shadow: 0 0 0 3px rgba(127,179,255,0.35); border-color: rgba(127,179,255,0.6); }",
        ".mark{ background: rgba(255,193,7,0.35); border-radius: 4px; padding: 0 2px; }",
        ".doc h1,.doc h2,.doc h3{ color:#EAF2FF; margin: 12px 0 6px; }",
        ".doc ul{ margin: 8px 0 8px 20px; }",
        ".doc li{ margin: 4px 0; }",
        ".doc code{ background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 6px; }",
        ".doc a{ color:#7FB3FF; text-decoration: none; }",
        ".doc a:hover{ text-decoration: underline; }",
    ].join("\n");

    const publicHref = tab === "subscription" ? "/legal/subscription" : "/legal/terms";

    function slugify(str) {
        return String(str || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
    function mdToHtml(md) {
        let t = escapeHtml(md || "");
        t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
        t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
        t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        t = t.replace(/\*(.*?)\*/g, "<em>$1</em>");
        t = t.replace(/^### (.*)$/gm, "<h3>$1</h3>");
        t = t.replace(/^## (.*)$/gm, "<h2>$1</h2>");
        t = t.replace(/^# (.*)$/gm, "<h1>$1</h1>");
        t = t.replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>");
        t = t.replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block.replace(/\n/g, "")}</ul>`);
        t = t.replace(/\n/g, "<br/>");
        return t;
    }
    function buildToc(md) {
        const lines = String(md || "").split(/\r?\n/);
        const toc = [];
        for (const line of lines) {
            const h1 = /^# (.*)$/.exec(line);
            const h2 = /^## (.*)$/.exec(line);
            const h3 = /^### (.*)$/.exec(line);
            if (h1) toc.push({ level: 1, text: h1[1], id: slugify(h1[1]) });
            else if (h2) toc.push({ level: 2, text: h2[1], id: slugify(h2[1]) });
            else if (h3) toc.push({ level: 3, text: h3[1], id: slugify(h3[1]) });
        }
        return toc;
    }
    function injectHeadingIds(html, toc) {
        let out = html;
        for (const item of toc) {
            const tag = item.level === 1 ? "h1" : item.level === 2 ? "h2" : "h3";
            const re = new RegExp(`<${tag}>([^<]+)</${tag}>`);
            out = out.replace(re, `<${tag} id="${item.id}">$1</${tag}>`);
        }
        return out;
    }
    function highlight(html, q) {
        const needle = (q || "").trim();
        if (!needle) return html;
        try {
            const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp(`(${esc})`, "gi");
            return html.replace(re, `<span class="mark">$1</span>`);
        } catch {
            return html;
        }
    }

    const md = tab === "subscription"
        ? (subMd || SUBSCRIPTION_MD_FALLBACK)
        : (termsMd || TERMS_MD_FALLBACK);
    const toc = useMemo(() => buildToc(md), [md]);

    const baseHtml = useMemo(() => mdToHtml(md), [md]);
    const htmlWithIds = useMemo(() => injectHeadingIds(baseHtml, toc), [baseHtml, toc]);
    const finalHtml = useMemo(() => highlight(htmlWithIds, search), [htmlWithIds, search]);

    const isEmpty = !md || md.trim() === "";
    const emptyFallback =
        `<p style="opacity:.85">No document content yet. This is a read-only viewer; legal text will be provided later.</p>`;

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 220);
        return () => clearTimeout(t);
    }, []);

    const [activeAnchor, setActiveAnchor] = useState(null);
    useEffect(() => {
        if (!mounted) return;
        const handler = () => {
            const pos = window.scrollY + 120;
            let best = null;
            for (const item of toc) {
                const el = document.getElementById(item.id);
                if (!el) continue;
                const top = el.getBoundingClientRect().top + window.scrollY;
                if (top <= pos) best = item.id;
            }
            setActiveAnchor(best);
        };
        handler();
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, [mounted, toc]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === "1") setTab("subscription");
            if (e.key === "2") setTab("terms");
            if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoadingDocs(true);
            setLoadErr("");
            try {
                const t = await fetch("/legal/terms.md", { cache: "no-store" });
                if (t.ok) {
                    const txt = await t.text();
                    if (!cancelled) setTermsMd(txt || "");
                } else {
                    if (!cancelled) setTermsMd("");
                }

                try {
                    const s = await fetch("/legal/subscription.md", { cache: "no-store" });
                    if (s.ok) {
                        const sTxt = await s.text();
                        if (!cancelled) setSubMd(sTxt || "");
                    } else {
                        if (!cancelled) setSubMd("");
                    }
                } catch {
                    if (!cancelled) setSubMd("");
                }
            } catch (e) {
                if (!cancelled) setLoadErr(e.message || "Failed to load policy documents.");
            } finally {
                if (!cancelled) setLoadingDocs(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, []);

    function onCopyLink() {
        const url = `${window.location.origin}${publicHref}`;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
            })
            .catch(() => { });
    }
    function onOpenPublic() {
        window.open(publicHref, "_blank", "noreferrer");
    }
    function onPrint() {
        window.print();
    }
    function onFont(delta) {
        setFont((f) => Math.max(12, Math.min(18, f + delta)));
    }
    function onJump(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
    }

    if (!mounted) {
        return (
            <>
                <div style={styles.wrap}>
                    <div style={styles.tabsBar}>
                        <div style={styles.skBar(140, 32)} />
                        <div style={styles.skBar(160, 32)} />
                    </div>
                    <div style={styles.shell(true)}>
                        <aside style={styles.tocCard}>
                            <div style={styles.skBar(120, 18)} />
                            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                                <div style={styles.skBar(180, 14)} />
                                <div style={styles.skBar(140, 14)} />
                                <div style={styles.skBar(160, 14)} />
                            </div>
                        </aside>
                        <section style={styles.card}>
                            <div style={styles.skBar(220, 20)} />
                            <div style={{ marginTop: 12 }}>
                                <div style={styles.skBlock(120)} />
                            </div>
                        </section>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </>
        );
    }

    return (
        <>
            <div style={styles.wrap}>
                <div style={styles.tabsBar}>
                    <button
                        className="cta"
                        style={styles.tab(tab === "subscription")}
                        onClick={() => setTab("subscription")}
                        aria-pressed={tab === "subscription"}
                        aria-label="Subscription Policy (press 1)"
                    >
                        Subscription Policy
                    </button>
                    <button
                        className="cta"
                        style={styles.tab(tab === "terms")}
                        onClick={() => setTab("terms")}
                        aria-pressed={tab === "terms"}
                        aria-label="Terms of Use (press 2)"
                    >
                        Terms of Use
                    </button>

                    <div style={{ flex: 1 }} />

                    <div style={styles.searchBox} className="i" title="Type to search (press / to focus)">
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" stroke="#7FB3FF" strokeWidth="1.4" fill="none" />
                            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#7FB3FF" strokeWidth="1.4" />
                        </svg>
                        <input
                            ref={searchRef}
                            placeholder={loadingDocs ? "Loading…" : "Search policy…"}
                            style={styles.input}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search within policy"
                        />
                    </div>

                    <button
                        className="cta"
                        style={styles.ghostBtn}
                        onClick={() => setReaderWide((v) => !v)}
                        title="Toggle reader layout"
                    >
                        {readerWide ? "Narrow View" : "Wide View"}
                    </button>

                    <div style={styles.metaRow}>
                        <span style={styles.pill}>Font</span>
                        <button className="cta" style={styles.ghostBtn} onClick={() => onFont(-1)} aria-label="Decrease font size">
                            A−
                        </button>
                        <button className="cta" style={styles.ghostBtn} onClick={() => onFont(+1)} aria-label="Increase font size">
                            A+
                        </button>
                    </div>
                </div>

                <div style={styles.shell(readerWide)}>
                    {readerWide && (
                        <aside style={styles.tocCard} aria-label="Table of contents">
                            <div style={styles.tocTitle}>On this page</div>
                            <nav style={{ display: "grid", gap: 4 }}>
                                {loadingDocs ? (
                                    <span style={styles.hint}>Loading…</span>
                                ) : toc.length === 0 ? (
                                    <span style={styles.hint}>No headings yet.</span>
                                ) : (
                                    toc.map((it) => (
                                        <a
                                            key={it.id}
                                            href={`#${it.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onJump(it.id);
                                            }}
                                            style={styles.tocItem(it.level - 1, activeAnchor === it.id)}
                                        >
                                            {it.text}
                                        </a>
                                    ))
                                )}
                            </nav>
                        </aside>
                    )}

                    <section style={styles.card}>
                        <div style={styles.titleRow}>
                            <div style={styles.title}>
                                {tab === "subscription" ? "Subscription Policy" : "Terms of Use"}
                            </div>
                            <div style={styles.actions}>
                                <a
                                    className="cta"
                                    style={styles.ghostBtn}
                                    href={publicHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open the public legal page"
                                >
                                    Open public page
                                </a>
                                <button
                                    className="cta"
                                    style={styles.ghostBtn}
                                    onClick={() => {
                                        onCopyLink();
                                    }}
                                    title="Copy public link"
                                    aria-live="polite"
                                >
                                    {copied ? "Copied!" : "Copy link"}
                                </button>
                                <button
                                    className="cta"
                                    style={styles.ghostBtn}
                                    onClick={() => onPrint()}
                                    title="Print this page"
                                >
                                    Print
                                </button>
                            </div>
                        </div>

                        <div
                            className="doc"
                            style={styles.doc(font)}
                            dangerouslySetInnerHTML={{
                                __html: loadErr
                                    ? `<p style="color:salmon">${escapeHtml(loadErr)}</p>`
                                    : loadingDocs
                                        ? `<p style="opacity:.85">Loading…</p>`
                                        : (isEmpty ? emptyFallback : finalHtml),
                            }}
                        />

                        <div style={styles.smallRow}>
                            <span style={styles.hint}>
                                Read-only viewer. Legal text will be provided later from your public pages.
                            </span>
                            <span style={styles.pill}>No editing here</span>
                            <span style={styles.pill}>Keyboard: 1 / 2 / /</span>
                        </div>
                    </section>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </>
    );
}
