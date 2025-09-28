"use client";
import { useEffect, useMemo, useState } from "react";

export default function FoldersClient() {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sel, setSel] = useState(null);
    const [err, setErr] = useState("");
    const [moments, setMoments] = useState([]);
    const [items, setItems] = useState([]);
    const [aliasMap, setAliasMap] = useState({});
    const [movingParent, setMovingParent] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [pickQ, setPickQ] = useState("");
    const [aliasDraft, setAliasDraft] = useState({});
    const [addingId, setAddingId] = useState("");

    async function loadTree() {
        setLoading(true);
        setErr("");
        try {
            const r = await fetch("/api/account/folders", { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Load failed");
            setTree(j.tree || []);
            if (!sel && (j.tree || []).length) {
                setSel(j.tree[0].id);
            }
        } catch (e) {
            setErr(e.message || "Load failed");
        } finally {
            setLoading(false);
        }
    }

    async function loadMoments() {
        const r = await fetch("/api/account/my-moments", { cache: "no-store" });
        const j = await r.json();
        if (r.ok) setMoments(j.items || []);
    }

    async function loadItems(folderId) {
        if (!folderId) return;
        const r = await fetch(
            `/api/account/folders/${folderId}/moments`,
            { cache: "no-store" }
        );
        const j = await r.json();
        if (r.ok) {
            setItems(j.items || []);
            const map = {};
            (j.items || []).forEach((it) => {
                map[it.id] = it.alias || "";
            });
            setAliasMap(map);
        }
    }

    useEffect(() => {
        loadTree();
        loadMoments();
    }, []);

    useEffect(() => {
        if (sel) loadItems(sel);
    }, [sel]);

    const styles = {
        wrap: {
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 12
        },
        card: {
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))"
        },
        sideHead: {
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontWeight: 700,
            color: "#EAF2FF"
        },
        sideBody: { padding: 10 },
        line: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 6px",
            borderRadius: 10,
            cursor: "pointer",
            color: "#C7D3E8"
        },
        lineActive: {
            background:
                "linear-gradient(180deg, rgba(13,99,229,0.18), rgba(13,99,229,0.12))",
            color: "#FFFFFF",
            border: "1px solid rgba(127,179,255,0.35)"
        },
        btn: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background:
                "linear-gradient(180deg,#0D63E5 0%,#0A4BBB 100%)",
            color: "#FFF",
            fontWeight: 600,
            boxShadow:
                "0 10px 18px rgba(13,99,229,0.28)," +
                " inset 0 1px 0 rgba(255,255,255,0.2)",
            fontSize: 13
        },
        ghost: {
            border: "1px solid rgba(255,255,255,0.10)",
            background:
                "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))",
            color: "#C7D3E8"
        },
        bar: {
            display: "flex",
            gap: 8,
            padding: 10,
            borderBottom: "1px solid rgba(255,255,255,0.08)"
        },
        mainBody: {
            padding: 10,
            display: "grid",
            gap: 10
        },
        row: {
            display: "grid",
            gridTemplateColumns: "minmax(220px,1fr) 1fr auto",
            gap: 8,
            padding: "10px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
                "linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))"
        },
        input: {
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(127,179,255,0.25)",
            background:
                "linear-gradient(180deg,rgba(8,12,24,0.8),rgba(9,11,19,0.8))",
            color: "#EAF2FF",
            outline: "none",
            fontSize: 14
        },
        hint: {
            fontSize: 12,
            color: "#8FA5C6"
        },
        overlay: {
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "grid", placeItems: "center", zIndex: 200
        },
        modal: {
            width: "min(920px, 96vw)",
            maxHeight: "82vh",
            overflow: "hidden",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg, rgba(13,16,31,0.92), rgba(12,14,24,0.88))",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)"
        },
        modalHead: {
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            color: "#EAF2FF", fontWeight: 700
        },
        modalBody: {
            padding: 12, display: "grid", gap: 10, maxHeight: "calc(82vh - 58px)", overflow: "auto"
        },
        listRow: {
            display: "grid",
            gridTemplateColumns: "minmax(260px,1fr) 1fr auto",
            gap: 10,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
        },
        meta: { fontSize: 12, color: "#8FA5C6" },
        badge: {
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "2px 8px", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)"
        },
        disabledBtn: {
            opacity: 0.5, cursor: "not-allowed"
        }
    };

    function renderNode(n, depth) {
        const pad = { paddingLeft: 8 + depth * 12 };
        const active = n.id === sel;
        return (
            <div key={n.id}>
                <div
                    style={{
                        ...styles.line,
                        ...(active ? styles.lineActive : {}),
                        ...pad
                    }}
                    onClick={() => setSel(n.id)}
                >
                    <span>📁</span>
                    <span style={{ fontWeight: 600 }}>{n.name}</span>
                </div>

                {(n.children || []).map((c) => renderNode(c, depth + 1))}
            </div>
        );
    }

    async function createFolder(parentId) {
        const name = prompt("Folder name:");
        if (!name) return;

        const r = await fetch("/api/account/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, parentId: parentId || null })
        });

        if (r.ok) {
            loadTree();
        } else {
            alert("Create failed");
        }
    }

    async function renameFolder() {
        if (!sel) return;

        const name = prompt("New name:");
        if (!name) return;

        const r = await fetch(`/api/account/folders/${sel}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });

        if (r.ok) {
            loadTree();
        } else {
            alert("Rename failed");
        }
    }

    async function moveFolder() {
        if (!sel) return;

        const to = movingParent || null;

        const r = await fetch(`/api/account/folders/${sel}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parentId: to })
        });

        if (r.ok) {
            setMovingParent("");
            loadTree();
        } else {
            alert("Move failed");
        }
    }

    async function deleteFolder() {
        if (!sel) return;

        if (!confirm("Delete this folder and its items?")) return;

        const r = await fetch(`/api/account/folders/${sel}`, {
            method: "DELETE"
        });

        if (r.ok) {
            setSel(null);
            loadTree();
            setItems([]);
        } else {
            alert("Delete failed");
        }
    }

    function addItem() {
        if (!sel) return;
        setPickQ("");
        setShowPicker(true);
    }

    async function addToFolder(momentId) {
        if (!sel || !momentId || addingId) return;
        setAddingId(momentId);
        try {
            const alias = aliasDraft[momentId] || "";
            const r = await fetch(`/api/account/folders/${sel}/moments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ momentId, alias })
            });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j?.error || "Add failed");
            }
            await loadItems(sel);

        } catch (e) {
            alert(e.message || "Add failed");
        } finally {
            setAddingId("");
        }
    }

    async function saveAlias(itemId) {
        const alias = aliasMap[itemId] || "";

        const r = await fetch(`/api/account/folder-items/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alias })
        });

        if (!r.ok) alert("Save failed");
    }

    async function removeItem(itemId) {
        if (!confirm("Remove this countdown from the folder?")) return;

        const r = await fetch(`/api/account/folder-items/${itemId}`, {
            method: "DELETE"
        });

        if (r.ok) {
            loadItems(sel);
        } else {
            alert("Remove failed");
        }
    }

    const flatFolders = useMemo(() => {
        const arr = [];
        const walk = (nodes, d) =>
            nodes.forEach((n) => {
                arr.push({ id: n.id, name: `${"— ".repeat(d)}${n.name}` });
                walk(n.children || [], d + 1);
            });
        walk(tree, 0);
        return arr;
    }, [tree]);

    const existingIds = useMemo(() => new Set(items.map(it => it.momentId)), [items]);
    const filteredMoments = useMemo(() => {
        const q = pickQ.trim().toLowerCase();
        if (!q) return moments;
        return moments.filter(m =>
            (m.title || "").toLowerCase().includes(q) ||
            (m.slug || "").toLowerCase().includes(q) ||
            (m.theme || "").toLowerCase().includes(q)
        );
    }, [pickQ, moments]);

    return (
        <div style={styles.wrap}>
            <aside style={styles.card}>
                <div style={styles.sideHead}>Folders</div>

                <div style={styles.sideBody}>
                    <div
                        style={{
                            display: "grid",
                            gap: 8,
                            marginBottom: 8
                        }}
                    >
                        <button
                            style={styles.btn}
                            onClick={() => createFolder(null)}
                        >
                            + New root
                        </button>

                        {!!sel && (
                            <button
                                style={{ ...styles.btn, ...styles.ghost }}
                                onClick={() => createFolder(sel)}
                            >
                                + New subfolder
                            </button>
                        )}
                    </div>

                    {loading && <div style={styles.hint}>Loading…</div>}
                    {!!err && <div style={{ color: "salmon" }}>{err}</div>}

                    <div>{tree.map((n) => renderNode(n, 0))}</div>
                </div>
            </aside>

            {/* 右侧主区 */}
            <section style={styles.card}>
                <div style={styles.bar}>
                    <button style={styles.btn} onClick={addItem}>
                        Add countdown
                    </button>

                    <button
                        style={{ ...styles.btn, ...styles.ghost }}
                        onClick={renameFolder}
                        disabled={!sel}
                    >
                        Rename
                    </button>

                    <select
                        value={movingParent}
                        onChange={(e) => setMovingParent(e.target.value)}
                        style={styles.input}
                    >
                        <option value="">
                            Move to… (choose parent)
                        </option>
                        <option value="">
                            (root)
                        </option>
                        {flatFolders
                            .filter((f) => f.id !== sel)
                            .map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                    </select>

                    <button
                        style={{ ...styles.btn, ...styles.ghost }}
                        onClick={moveFolder}
                        disabled={!sel || movingParent === undefined}
                    >
                        Apply move
                    </button>

                    <div style={{ flex: 1 }} />

                    <button
                        style={{
                            ...styles.btn,
                            border: "1px solid rgba(255,80,80,0.35)",
                            background:
                                "linear-gradient(180deg,rgba(255,80,80,0.15),rgba(255,80,80,0.08))",
                            color: "#FFD8D8"
                        }}
                        onClick={deleteFolder}
                        disabled={!sel}
                    >
                        Delete
                    </button>
                </div>

                <div style={styles.mainBody}>
                    {!sel && (
                        <div style={styles.hint}>
                            Select a folder to manage its items.
                        </div>
                    )}

                    {sel &&
                        items.map((it) => (
                            <div key={it.id} style={styles.row}>
                                <div>
                                    <a
                                        href={`/c/${it.moment.slug}`}
                                        style={{
                                            color: "#EAF2FF",
                                            textDecoration: "none",
                                            fontWeight: 700
                                        }}
                                    >
                                        {it.moment.title}
                                    </a>

                                    <div style={styles.hint}>
                                        /c/{it.moment.slug} ·{" "}
                                        {it.moment.isEpic ? "EPIC" : "normal"} ·{" "}
                                        {it.moment.theme}
                                    </div>
                                </div>

                                <div>
                                    <input
                                        style={styles.input}
                                        placeholder="Alias (optional)"
                                        value={aliasMap[it.id] || ""}
                                        onChange={(e) =>
                                            setAliasMap({
                                                ...aliasMap,
                                                [it.id]: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={styles.btn}
                                        onClick={() => saveAlias(it.id)}
                                    >
                                        Save alias
                                    </button>

                                    <button
                                        style={{ ...styles.btn, ...styles.ghost }}
                                        onClick={() => removeItem(it.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}

                    {sel && items.length === 0 && (
                        <div style={styles.hint}>
                            This folder is empty. Click “Add countdown”.
                        </div>
                    )}
                </div>
            </section>

            {showPicker && (
                <div style={styles.overlay} onClick={() => setShowPicker(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHead}>
                            <span>Select countdowns to add</span>
                            <div style={{ flex: 1 }} />
                            <button
                                style={{ ...styles.btn, ...styles.ghost }}
                                onClick={() => setShowPicker(false)}
                            >
                                Close
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <input
                                style={styles.input}
                                placeholder="Search my countdowns (title / slug / theme)…"
                                value={pickQ}
                                onChange={(e) => setPickQ(e.target.value)}
                            />

                            {filteredMoments.map((m) => {
                                const exists = existingIds.has(m.id);
                                return (
                                    <div key={m.id} style={styles.listRow}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#EAF2FF" }}>
                                                {m.title}
                                            </div>
                                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                                <span style={styles.badge}>/c/{m.slug}</span>
                                                <span style={styles.badge}>
                                                    {m.isEpic ? "EPIC" : "normal"}
                                                </span>
                                                <span style={styles.badge}>{m.theme || "default"}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <input
                                                style={styles.input}
                                                placeholder="Alias (optional)"
                                                value={aliasDraft[m.id] || ""}
                                                onChange={(e) =>
                                                    setAliasDraft((d) => ({ ...d, [m.id]: e.target.value }))
                                                }
                                            />
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                            <button
                                                style={{
                                                    ...styles.btn,
                                                    ...(exists || addingId === m.id ? styles.disabledBtn : {})
                                                }}
                                                disabled={exists || addingId === m.id}
                                                onClick={() => addToFolder(m.id)}
                                            >
                                                {exists ? "Added" : (addingId === m.id ? "Adding…" : "Add")}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredMoments.length === 0 && (
                                <div style={{ color: "#B9C6DD" }}>
                                    No results. Try a different query.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
