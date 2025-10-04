"use client";
import { useState } from "react";

export default function ShareClient() {
    const [tree] = useState([]);
    const [sel] = useState(null);
    const [sharing] = useState(null);
    const [msg] = useState("");

    const S = {
        wrap: {
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 10
        },
        card: {
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.03)"
        },
        head: {
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            fontWeight: 700,
            color: "#EAF2FF"
        },
        side: {
            padding: 10,
            color: "#C7D3E8",
            fontSize: 14
        },
        main: {
            padding: 10,
            display: "grid",
            gap: 10
        },
        sec: {
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            padding: 10,
            display: "grid",
            gap: 8
        },
        row: {
            display: "grid",
            gap: 6
        },
        hint: {
            fontSize: 12,
            color: "#8FA5C6"
        },
        input: {
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid rgba(127,179,255,0.25)",
            background: "rgba(8,12,24,0.7)",
            color: "#EAF2FF",
            outline: "none",
            fontSize: 14
        },
        select: {
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid rgba(127,179,255,0.25)",
            background: "rgba(8,12,24,0.7)",
            color: "#EAF2FF",
            outline: "none",
            fontSize: 14
        },
        btn: {
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "#0D63E5",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14
        },
        ghost: {
            background: "rgba(255,255,255,0.04)",
            color: "#C7D3E8",
            border: "1px solid rgba(255,255,255,0.1)"
        },
        badge: {
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#C7D3E8",
            fontSize: 12
        }
    };

    return (
        <>
            <div style={S.wrap}>
                <aside style={S.card}>
                    <div style={S.head}>Folders</div>
                    <div style={S.side}>
                        {tree.length === 0 && <div style={S.hint}>No folders yet.</div>}
                    </div>
                </aside>

                <section style={S.card}>
                    <div style={S.head}>Sharing</div>
                    <div style={S.main}>
                        {!sel && <div style={S.hint}>Select a folder to manage sharing.</div>}

                        <section style={S.sec}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <span>Read-only public link</span>
                                <span style={S.badge}>
                                    {sharing?.publicEnabled ? "ENABLED" : "DISABLED"}
                                </span>
                            </div>

                            {sharing?.publicEnabled ? (
                                <div style={S.row}>
                                    <div className="label" style={S.hint}>
                                        Public URL
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            flexWrap: "wrap"
                                        }}
                                    >
                                        <input
                                            style={{ ...S.input, flex: 1, minWidth: 240 }}
                                            readOnly
                                            value={sharing?.publicUrl || ""}
                                        />
                                        <button style={{ ...S.btn, ...S.ghost }} disabled>
                                            Open
                                        </button>
                                        <button style={{ ...S.btn, ...S.ghost }} disabled>
                                            Copy
                                        </button>
                                    </div>
                                    {!!sharing?.tokenHint && (
                                        <div style={S.hint}>Token: {sharing.tokenHint}</div>
                                    )}
                                </div>
                            ) : (
                                <div style={S.hint}>Public link is disabled.</div>
                            )}
                        </section>

                        <section style={S.sec}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <span>Team members</span>
                                {sharing?.myRole && (
                                    <span style={S.badge}>Your role: {sharing.myRole}</span>
                                )}
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 160px auto",
                                    gap: 8
                                }}
                            >
                                <input
                                    style={S.input}
                                    placeholder="Email to invite"
                                    disabled
                                />
                                <select style={S.select} disabled>
                                    <option>Viewer</option>
                                    <option>Editor</option>
                                    <option>Owner</option>
                                </select>
                                <button style={S.btn} disabled>
                                    Add
                                </button>
                            </div>

                            <div style={{ display: "grid", gap: 8 }}>
                                {(!sharing?.members || sharing.members.length === 0) && (
                                    <div style={S.hint}>No members yet.</div>
                                )}
                                {(sharing?.members || []).map((m) => (
                                    <div
                                        key={m.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "minmax(200px,1fr) 160px auto",
                                            gap: 8,
                                            padding: 8,
                                            borderRadius: 8,
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}
                                    >
                                        <div style={{ display: "grid", gap: 2 }}>
                                            <strong>{m.name || "—"}</strong>
                                            <span style={S.hint}>{m.email}</span>
                                        </div>
                                        <select style={S.select} value={m.role} disabled>
                                            <option value="VIEWER">Viewer</option>
                                            <option value="EDITOR">Editor</option>
                                            <option value="OWNER">Owner</option>
                                        </select>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                justifyContent: "flex-end"
                                            }}
                                        >
                                            <button style={{ ...S.btn, ...S.ghost }} disabled>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section style={S.sec}>
                            <div style={{ fontWeight: 600, color: "#EAF2FF" }}>
                                Permission levels
                            </div>
                            <div style={S.hint}>
                                <b>Viewer</b>: Read-only access to this folder and its items.
                                <br />
                                <b>Editor</b>: Viewer + add/remove items and create subfolders.
                                <br />
                                <b>Owner</b>: Manage members, change sharing, delete/move the
                                folder.
                            </div>
                        </section>
                    </div>
                </section>
            </div>

            {!!msg && <p style={{ marginTop: 10, color: "#8BD17C" }}>{msg}</p>}
        </>
    );
}
