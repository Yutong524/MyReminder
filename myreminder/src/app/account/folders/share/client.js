"use client";
import { useEffect, useMemo, useState } from "react";

export default function ShareClient() {
    const [tree, setTree] = useState([]);
    const [sel, setSel] = useState(null);
    const [loadingTree, setLoadingTree] = useState(false);
    const [err, setErr] = useState("");

    const [sharing, setSharing] = useState(null);
    const [loadingSharing, setLoadingSharing] = useState(false);
    const [msg, setMsg] = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addRole, setAddRole] = useState("VIEWER");
    const [expiryLocal, setExpiryLocal] = useState("");
    const [password, setPassword] = useState("");

    const styles = {
        wrap: {
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: 12
        },
        card: {
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
        },
        head: {
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            fontWeight: 800,
            color: "#EAF2FF",
            letterSpacing: "0.01em"
        },
        sideBody: { padding: 10 },
        line: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 10px",
            borderRadius: 10,
            cursor: "pointer",
            color: "#C7D3E8",
            border: "1px solid transparent"
        },
        active: {
            background: "linear-gradient(180deg, rgba(13,99,229,0.18), rgba(13,99,229,0.10))",
            color: "#FFFFFF",
            border: "1px solid rgba(127,179,255,0.35)"
        },
        hint: { fontSize: 12, color: "#8FA5C6" },
        empty: { fontSize: 14, color: "#B9C6DD" },

        mainBody: { padding: 12, display: "grid", gap: 12 },

        sec: {
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
        },
        secHead: {
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontWeight: 700,
            color: "#EAF2FF",
            letterSpacing: "0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
        },
        secBody: { padding: 12, display: "grid", gap: 10 },

        row: { display: "grid", gap: 8 },
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
        select: {
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
            background: "linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)",
            color: "#fff",
            fontWeight: 700,
            boxShadow: "0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
            fontSize: 14
        },
        ghost: {
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            border: "1px solid rgba(255,255,255,0.10)"
        },
        danger: {
            border: "1px solid rgba(255,80,80,0.35)",
            background: "linear-gradient(180deg, rgba(255,80,80,0.15), rgba(255,80,80,0.08))",
            color: "#FFD8D8"
        },
        list: { display: "grid", gap: 8 },
        memberRow: {
            display: "grid",
            gridTemplateColumns: "minmax(200px,1fr) 160px auto",
            gap: 8,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)"
        },
        badge: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: 12
        },
        linkRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }
    };

    const css = [
        ".i{ transition: border-color 160ms ease, box-shadow 160ms ease; }",
        ".i:focus{ box-shadow: 0 0 0 3px rgba(127,179,255,0.35); border-color: rgba(127,179,255,0.6); }",
        ".cta{ transition: transform 160ms ease, box-shadow 160ms ease; }",
        ".cta:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38), inset 0 1px 0 rgba(255,255,255,0.25); }",
    ].join("\n");

    async function loadTree() {
        setLoadingTree(true);
        setErr("");
        try {
            const r = await fetch("/api/account/folders", { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Load folders failed");
            const tree = j.tree || [];
            setTree(tree);
            if (!sel && tree.length > 0) setSel(tree[0].id);
        } catch (e) {
            setErr(e.message || "Load folders failed");
        } finally {
            setLoadingTree(false);
        }
    }

    async function loadSharing(folderId) {
        if (!folderId) return;
        setLoadingSharing(true);
        setMsg("");
        try {
            const r = await fetch(`/api/account/folders/${folderId}/sharing`, { cache: "no-store" });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Load sharing failed");
            setSharing(j);

            if (j?.publicExpiresAt) {
                const d = new Date(j.publicExpiresAt);
                const pad = (n) => String(n).padStart(2, "0");
                const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                setExpiryLocal(local);
            } else {
                setExpiryLocal("");
            }

            setPassword("");
        } catch (e) {
            setMsg(e.message || "Load sharing failed");
        } finally {
            setLoadingSharing(false);
        }
    }

    useEffect(() => { loadTree(); }, []);
    useEffect(() => { if (sel) loadSharing(sel); }, [sel]);

    function renderNode(n, depth) {
        const active = n.id === sel;
        return (
            <div key={n.id}>
                <div
                    style={{ ...styles.line, ...(active ? styles.active : {}), paddingLeft: 8 + depth * 14 }}
                    onClick={() => setSel(n.id)}
                >
                    <span>📁</span>
                    <span style={{ fontWeight: 700 }}>{n.name}</span>
                </div>
                {(n.children || []).map((c) => renderNode(c, depth + 1))}
            </div>
        );
    }

    async function togglePublic(enabled) {
        if (!sel) return;
        const r = await fetch(`/api/account/folders/${sel}/sharing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicEnabled: !!enabled })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
            setMsg(j?.error || "Update failed");
            return;
        }
        setMsg("Updated.");
        loadSharing(sel);
    }

    const localToUtcIso = (local) => (local ? new Date(local).toISOString() : null);
    async function saveSharingAdvanced() {
        if (!sel) return;
        const publicExpiresAt = expiryLocal ? localToUtcIso(expiryLocal) : null;
        const publicPassword = password || "";
        const r = await fetch(`/api/account/folders/${sel}/sharing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                publicEnabled: true,
                publicExpiresAt,
                publicPassword
            })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return setMsg(j?.error || "Save failed");
        setMsg("Saved.");
        loadSharing(sel);
    }

    async function rotateLink() {
        if (!sel) return;
        if (!confirm("Rotate the public link? The old link will stop working.")) return;
        const r = await fetch(`/api/account/folders/${sel}/sharing/rotate`, { method: "POST" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
            setMsg(j?.error || "Rotate failed");
            return;
        }
        setMsg("Link rotated.");
        loadSharing(sel);
    }

    async function copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            setMsg("Copied link.");
        } catch {
            setMsg("Copy failed.");
        }
    }

    async function addMember() {
        if (!sel) return;
        const email = (addEmail || "").trim().toLowerCase();
        if (!email) return setMsg("Email required.");
        const r = await fetch(`/api/account/folders/${sel}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role: addRole })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
            setMsg(j?.error || "Add member failed");
            return;
        }
        setAddEmail("");
        setAddRole("VIEWER");
        setMsg("Member added.");
        loadSharing(sel);
    }

    async function changeRole(memberId, role) {
        const r = await fetch(`/api/account/folders/${sel}/members/${memberId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role })
        });
        if (!r.ok) setMsg("Change role failed");
        else loadSharing(sel);
    }

    async function removeMember(memberId) {
        if (!confirm("Remove this member?")) return;
        const r = await fetch(`/api/account/folders/${sel}/members/${memberId}`, {
            method: "DELETE"
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) setMsg(j?.error || "Remove failed");
        else loadSharing(sel);
    }

    const flatTree = useMemo(() => {
        const out = [];
        const walk = (nodes, d) => nodes.forEach(n => {
            out.push({ id: n.id, name: `${"— ".repeat(d)}${n.name}` });
            walk(n.children || [], d + 1);
        });
        walk(tree, 0);
        return out;
    }, [tree]);

    return (
        <>
            <div style={styles.wrap}>
                <aside style={styles.card}>
                    <div style={styles.head}>Folders</div>
                    <div style={styles.sideBody}>
                        {loadingTree && <div style={styles.hint}>Loading…</div>}
                        {!!err && <div style={{ color: "salmon" }}>{err}</div>}
                        {tree.length === 0 && !loadingTree && <div style={styles.empty}>No folders yet.</div>}
                        <div>{tree.map(n => renderNode(n, 0))}</div>
                    </div>
                </aside>

                <section style={styles.card}>
                    <div style={styles.head}>Sharing</div>
                    <div style={styles.mainBody}>
                        {!sel && <div style={styles.hint}>Select a folder to manage sharing.</div>}

                        {sel && (
                            <>
                                <section style={styles.sec}>
                                    <div style={styles.secHead}>
                                        <span>Read-only public link</span>
                                        {sharing?.publicEnabled
                                            ? <span style={styles.badge}>ENABLED</span>
                                            : <span style={styles.badge}>DISABLED</span>}
                                    </div>
                                    <div style={styles.secBody}>
                                        <div className="row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            <button
                                                className="cta"
                                                style={styles.btn}
                                                onClick={() => togglePublic(!(sharing?.publicEnabled))}
                                                disabled={loadingSharing}
                                            >
                                                {sharing?.publicEnabled ? "Disable link" : "Enable link"}
                                            </button>

                                            <button
                                                className="cta"
                                                style={{ ...styles.btn, ...styles.ghost }}
                                                onClick={rotateLink}
                                                disabled={!sharing?.publicEnabled}
                                            >
                                                Rotate link
                                            </button>
                                        </div>

                                        {sharing?.publicEnabled && (
                                            <div style={{ display: "grid", gap: 10 }}>
                                                <label>
                                                    <div className="label" style={styles.hint}>Expiry (optional)</div>
                                                    <input
                                                        type="datetime-local"
                                                        className="i"
                                                        style={styles.input}
                                                        value={expiryLocal}
                                                        onChange={(e) => setExpiryLocal(e.target.value)}
                                                    />
                                                    <div style={styles.hint}>Leave empty to never expire.</div>
                                                </label>
                                                <label>
                                                    <div className="label" style={styles.hint}>Password (optional)</div>
                                                    <input
                                                        type="password"
                                                        className="i"
                                                        style={styles.input}
                                                        placeholder="Set or update password; leave blank to clear"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                </label>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button className="cta" style={styles.btn} onClick={saveSharingAdvanced}>
                                                        Save sharing settings
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {sharing?.publicEnabled && (
                                            <div style={styles.row}>
                                                <label>
                                                    <div className="label" style={styles.hint}>Public URL</div>
                                                    <div style={styles.linkRow}>
                                                        <input
                                                            className="i"
                                                            style={{ ...styles.input, flex: 1, minWidth: 280 }}
                                                            readOnly
                                                            value={sharing.publicUrl || ""}
                                                        />
                                                        <a
                                                            href={sharing.publicUrl || "#"}
                                                            target="_blank" rel="noreferrer"
                                                            className="cta"
                                                            style={{ ...styles.btn, ...styles.ghost }}
                                                        >
                                                            Open
                                                        </a>
                                                        <button
                                                            className="cta"
                                                            style={{ ...styles.btn, ...styles.ghost }}
                                                            onClick={() => copy(sharing.publicUrl || "")}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </label>
                                                {!!sharing?.tokenHint && (
                                                    <div style={styles.hint}>Token: {sharing.tokenHint}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section style={styles.sec}>
                                    <div style={styles.secHead}>
                                        <span>Team members</span>
                                        {sharing?.myRole && <span style={styles.badge}>Your role: {sharing.myRole}</span>}
                                    </div>
                                    <div style={styles.secBody}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px auto", gap: 8 }}>
                                            <input
                                                className="i"
                                                style={styles.input}
                                                placeholder="Email to invite"
                                                value={addEmail}
                                                onChange={(e) => setAddEmail(e.target.value)}
                                            />
                                            <select
                                                style={styles.select}
                                                value={addRole}
                                                onChange={(e) => setAddRole(e.target.value)}
                                            >
                                                <option value="VIEWER">Viewer</option>
                                                <option value="EDITOR">Editor</option>
                                                <option value="OWNER">Owner</option>
                                            </select>
                                            <button className="cta" style={styles.btn} onClick={addMember}>
                                                Add
                                            </button>
                                        </div>

                                        <div style={styles.list}>
                                            {(sharing?.members || []).map(m => (
                                                <div key={m.id} style={styles.memberRow}>
                                                    <div style={{ display: "grid", gap: 2 }}>
                                                        <strong>{m.name || "—"}</strong>
                                                        <span style={styles.hint}>{m.email}</span>
                                                    </div>
                                                    <select
                                                        style={styles.select}
                                                        value={m.role}
                                                        onChange={(e) => changeRole(m.id, e.target.value)}
                                                    >
                                                        <option value="VIEWER">Viewer</option>
                                                        <option value="EDITOR">Editor</option>
                                                        <option value="OWNER">Owner</option>
                                                    </select>
                                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                                        <button
                                                            className="cta"
                                                            style={{ ...styles.btn, ...styles.ghost, ...styles.danger }}
                                                            onClick={() => removeMember(m.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!sharing?.members || sharing.members.length === 0) && (
                                                <div style={styles.hint}>No members yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section style={styles.sec}>
                                    <div style={styles.secHead}>Permission levels</div>
                                    <div style={styles.secBody}>
                                        <div style={styles.hint}>
                                            <b>Viewer</b>: Read-only access to this folder and its items.<br />
                                            <b>Editor</b>: Everything Viewer can, plus add/remove items and create subfolders.<br />
                                            <b>Owner</b>: Manage members, change sharing, delete/move the folder.
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                </section>
            </div>

            {(msg) && (
                <p style={{ marginTop: 12, color: "#8BD17C" }}>{msg}</p>
            )}

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </>
    );
}
