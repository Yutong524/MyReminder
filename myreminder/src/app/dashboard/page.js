import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard({ searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect(`/signin?callbackUrl=/dashboard`);
    }
    const userId = session.user.id;
    const moments = await prisma.moment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
            visibility: true,
            views: true,
            uniques: true,
            cheerCount: true,
            theme: true,
            isEpic: true,
            epicApplications: {
                select: { status: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 1
            }
        },
    });

    const following = await prisma.follow.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            moment: {
                select: {
                    id: true, title: true, slug: true, createdAt: true,
                    visibility: true, views: true, uniques: true, cheerCount: true, userId: true,
                    isEpic: true
                }
            }
        }
    });

    const sp = Object.fromEntries(Object.entries(searchParams || {}));
    const sortEpic = String(sp.sortEpic || "created_desc");
    const sortOther = String(sp.sortOther || "created_desc");
    const themeFilter = String(sp.theme || "all");

    const themeSet = new Set();
    moments.forEach(m => { if (m.theme) themeSet.add(m.theme); });
    const themes = ["all", ...Array.from(themeSet)];

    const filtered = themeFilter === "all"
        ? moments
        : moments.filter(m => (m.theme || "default") === themeFilter);

    const epicGroup = filtered.filter(m => m.isEpic === true);
    const otherGroup = filtered.filter(m => !m.isEpic);

    function applySort(arr, sortKey) {
        const by = (fn) => (a, b) => fn(b) - fn(a);
        const byAsc = (fn) => (a, b) => fn(a) - fn(b);
        switch (sortKey) {
            case "created_asc": return arr.sort(byAsc(m => new Date(m.createdAt).getTime()));
            case "views_desc": return arr.sort(by(m => Number(m.views || 0)));
            case "cheers_desc": return arr.sort(by(m => Number(m.cheerCount || 0)));
            case "created_desc":
            default: return arr.sort(by(m => new Date(m.createdAt).getTime()));
        }
    }
    applySort(epicGroup, sortEpic);
    applySort(otherGroup, sortOther);

    function hrefWith(updates) {
        const q = new URLSearchParams(sp);
        Object.entries(updates).forEach(([k, v]) => {
            if (v === undefined || v === null || v === "") q.delete(k);
            else q.set(k, String(v));
        });
        const qs = q.toString();
        return qs ? `?${qs}` : `?`;
    }

    const totals = moments.reduce(
        (a, m) => {
            a.count += 1;
            a.views += typeof m.views === "number" ? m.views : 0;
            a.uniques += typeof m.uniques === "number" ? m.uniques : 0;
            a.cheers += typeof m.cheerCount === "number" ? m.cheerCount : 0;
            return a;
        },
        { count: 0, views: 0, uniques: 0, cheers: 0 }
    );

    const styles = {
        page: {
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden",
            padding: "24px",
            background: "linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)",
            color: "#EAF2FF"
        },
        grid: {
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px, 40px 40px",
            maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)",
            pointerEvents: "none"
        },
        rays: {
            position: "absolute",
            inset: 0,
            background: "conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)",
            filter: "blur(40px)",
            pointerEvents: "none"
        },
        shell: {
            width: "100%",
            maxWidth: 960,
            margin: "40px auto",
            padding: 16,
            position: "relative"
        },
        headerCard: {
            borderRadius: "20px",
            background: "linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: "22px",
            backdropFilter: "blur(10px)"
        },
        h1: {
            margin: 0,
            fontSize: "clamp(24px, 4vw, 32px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            backgroundImage: "linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent"
        },
        sub: { marginTop: 6, color: "#B9C6DD", fontSize: "14px" },
        bar: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 14,
            flexWrap: "wrap"
        },
        pillRow: { display: "flex", gap: 8, flexWrap: "wrap" },
        pill: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 34,
            padding: "0 12px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: "13px"
        },
        dotBlue: {
            width: 8, height: 8, borderRadius: 99, background: "#0D63E5",
            boxShadow: "0 0 0 2px rgba(13,99,229,0.25)"
        },
        dotGold: {
            width: 8, height: 8, borderRadius: 99, background: "#FFC107",
            boxShadow: "0 0 0 2px rgba(255,193,7,0.25)"
        },
        actions: { display: "flex", gap: 8, flexWrap: "wrap" },
        linkGhost: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 12px",
            textDecoration: "none",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: "14px"
        },
        linkPrimary: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 12px",
            textDecoration: "none",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)",
            color: "#FFFFFF",
            fontWeight: 600,
            boxShadow: "0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)"
        },
        listCard: {
            marginTop: 16,
            borderRadius: "18px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
            overflow: "hidden"
        },
        listTitle: {
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontWeight: 700,
            color: "#EAF2FF",
            letterSpacing: "0.01em"
        },
        sectionBar: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"
        },
        subPills: { display: "flex", gap: 6, flexWrap: "wrap" },
        sortLink: {
            textDecoration: "none",
            borderRadius: "999px",
            padding: "6px 10px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: 12
        },
        sortLinkActive: {
            border: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)",
            color: "#FFF",
            boxShadow: "0 8px 16px rgba(13,99,229,0.25), inset 0 1px 0 rgba(255,255,255,0.20)"
        },
        row: {
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12
        },
        left: { display: "grid", gap: 4 },
        titleLink: {
            textDecoration: "none",
            color: "#EAF2FF",
            fontWeight: 600,
            letterSpacing: "0.01em"
        },
        meta: { fontSize: 12, color: "#8FA5C6" },
        metaBadge: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "2px 8px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.10)",
            marginRight: 6,
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
        },
        epicBadge: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "2px 8px",
            borderRadius: "999px",
            border: "1px solid rgba(255,215,0,0.35)",
            marginRight: 6,
            background: "linear-gradient(180deg, rgba(255,215,0,0.18), rgba(255,215,0,0.08))",
            color: "#FFE58A",
            fontWeight: 700
        },
        rightActions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
        actionLink: {
            textDecoration: "none",
            borderRadius: "10px",
            padding: "8px 10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: 13
        },
        actionBtn: {
            borderRadius: "10px",
            padding: "8px 10px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontSize: 13,
            cursor: "pointer"
        },
        deleteBtn: {
            borderRadius: "10px",
            padding: "8px 10px",
            border: "1px solid rgba(255,80,80,0.35)",
            background: "linear-gradient(180deg, rgba(255,80,80,0.15), rgba(255,80,80,0.08))",
            color: "#FFD8D8",
            fontSize: 13
        },
        empty: {
            padding: "28px 20px",
            display: "grid",
            gap: 10,
            placeItems: "center"
        }
    };

    const css = [
        ".lp{ transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, opacity 160ms ease; }",
        ".lp:hover{ transform: translateY(-1px); box-shadow: 0 12px 22px rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.18); }",
        ".primary:hover{ transform: translateY(-1px); box-shadow: 0 16px 30px rgba(13,99,229,0.38); }",
        ".row:hover{ background: rgba(255,255,255,0.02); }",
        "@media (max-width: 760px){ .row{ flex-direction: column; align-items: flex-start; } }"
    ].join("\n");

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden="true" />
            <div style={styles.rays} aria-hidden="true" />

            <div style={styles.shell}>
                <section style={styles.headerCard}>
                    <h1 style={styles.h1}>My Countdowns</h1>
                    <p style={styles.sub}>Only countdowns you created while signed in will appear here.</p>

                    <div style={styles.bar}>
                        <div style={styles.pillRow}>
                            <span style={styles.pill}><span style={styles.dotBlue} />Total: {totals.count}</span>
                            <span style={styles.pill}><span style={styles.dotBlue} />Views: {totals.views}</span>
                            <span style={styles.pill}><span style={styles.dotGold} />Uniques: {totals.uniques}</span>
                            <span style={styles.pill}><span style={styles.dotGold} />Cheers: {totals.cheers}</span>
                        </div>
                        <div style={styles.actions}>
                            <a href="/new" className="lp primary" style={styles.linkPrimary}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Create
                            </a>
                            <a href="/api/export" rel="nofollow" className="lp" style={styles.linkGhost}>Download my data (JSON)</a>
                            <a href="/api/export?format=csv" rel="nofollow" className="lp" style={styles.linkGhost}>Download moments (CSV)</a>
                            <a href="/epic" className="lp" style={styles.linkGhost}>Browse Epic</a>
                        </div>
                    </div>
                </section>


                <section style={styles.listCard}>
                    <div style={styles.listTitle}>Filter by Template</div>
                    <div style={styles.sectionBar}>
                        <div style={styles.subPills}>
                            {themes.map(th => {
                                const active = th === themeFilter;
                                return (
                                    <a key={th} href={hrefWith({ theme: th })}
                                        style={{ ...styles.sortLink, ...(active ? styles.sortLinkActive : {}) }}>
                                        {th === "all" ? "All" : th}
                                    </a>
                                );
                            })}
                        </div>
                        <span style={{ color: "#8FA5C6", fontSize: 12 }}>Theme: {themeFilter}</span>
                    </div>
                </section>

                <section style={styles.listCard}>
                    <div style={styles.listTitle}>Epic Countdowns</div>
                    <div style={styles.sectionBar}>
                        <div style={styles.subPills}>
                            <a href={hrefWith({ sortEpic: "created_desc" })} style={{ ...styles.sortLink, ...(sortEpic === "created_desc" ? styles.sortLinkActive : {}) }}>Newest</a>
                            <a href={hrefWith({ sortEpic: "created_asc" })} style={{ ...styles.sortLink, ...(sortEpic === "created_asc" ? styles.sortLinkActive : {}) }}>Oldest</a>
                            <a href={hrefWith({ sortEpic: "views_desc" })} style={{ ...styles.sortLink, ...(sortEpic === "views_desc" ? styles.sortLinkActive : {}) }}>Most Views</a>
                            <a href={hrefWith({ sortEpic: "cheers_desc" })} style={{ ...styles.sortLink, ...(sortEpic === "cheers_desc" ? styles.sortLinkActive : {}) }}>Most Cheers</a>
                        </div>
                        <span style={{ color: "#8FA5C6", fontSize: 12 }}>Sorted: {sortEpic}</span>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {epicGroup.map(m => (
                            <li key={m.id} className="row" style={styles.row}>
                                <div style={styles.left}>
                                    <a href={`/c/${m.slug}`} style={styles.titleLink}>{m.title}</a>
                                    <div style={styles.meta}>
                                        <span style={styles.metaBadge}>/c/{m.slug}</span>
                                        <span style={styles.metaBadge}>{m.visibility}</span>

                                        {m.isEpic && (
                                            <span style={styles.epicBadge}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d="M12 3l2.5 5.2L20 9l-4 3.9.9 5.6L12 15.9 7.1 18.5 8 12.9 4 9l5.5-.8L12 3z" stroke="#FFD700" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                EPIC
                                            </span>
                                        )}

                                        {typeof m.views === "number" && typeof m.uniques === "number" && (
                                            <span style={styles.metaBadge}>👁 {m.views} / {m.uniques}</span>
                                        )}
                                        {typeof m.cheerCount === "number" && (
                                            <span style={styles.metaBadge}>🎉 {m.cheerCount}</span>
                                        )}
                                        <span style={styles.metaBadge}>{m.theme}</span>
                                        <span style={styles.metaBadge}>
                                            {new Date(m.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div style={styles.rightActions}>
                                    <a href={`/c/${m.slug}/edit`} style={styles.actionLink}>Edit</a>
                                    <a href={`/api/moments/${m.slug}/analytics`} rel="nofollow" style={styles.actionLink}>Analytics</a>
                                    <a href={`/api/moments/${m.slug}/export`} rel="nofollow" style={styles.actionLink}>Export</a>

                                    <a href={`/epic?mine=1`} style={styles.actionLink}>Manage Epic</a>
                                    <form action={`/api/moments/${m.slug}/delete`} method="post">
                                        <button style={styles.deleteBtn}>Delete</button>
                                    </form>
                                </div>
                            </li>
                        ))}
                        {epicGroup.length === 0 && (
                            <li style={styles.empty}>
                                <div style={{ textAlign: "center", color: "#B9C6DD" }}>
                                    No Epic items under current filter.
                                </div>
                            </li>
                        )}
                    </ul>
                </section>

                <section style={styles.listCard}>
                    <div style={styles.listTitle}>Other Countdowns</div>
                    <div style={styles.sectionBar}>
                        <div style={styles.subPills}>
                            <a href={hrefWith({ sortOther: "created_desc" })} style={{ ...styles.sortLink, ...(sortOther === "created_desc" ? styles.sortLinkActive : {}) }}>Newest</a>
                            <a href={hrefWith({ sortOther: "created_asc" })} style={{ ...styles.sortLink, ...(sortOther === "created_asc" ? styles.sortLinkActive : {}) }}>Oldest</a>
                            <a href={hrefWith({ sortOther: "views_desc" })} style={{ ...styles.sortLink, ...(sortOther === "views_desc" ? styles.sortLinkActive : {}) }}>Most Views</a>
                            <a href={hrefWith({ sortOther: "cheers_desc" })} style={{ ...styles.sortLink, ...(sortOther === "cheers_desc" ? styles.sortLinkActive : {}) }}>Most Cheers</a>
                        </div>
                        <span style={{ color: "#8FA5C6", fontSize: 12 }}>Sorted: {sortOther}</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {otherGroup.map(m => (
                            <li key={m.id} className="row" style={styles.row}>
                                <div style={styles.left}>
                                    <a href={`/c/${m.slug}`} style={styles.titleLink}>{m.title}</a>
                                    <div style={styles.meta}>
                                        <span style={styles.metaBadge}>/c/{m.slug}</span>
                                        <span style={styles.metaBadge}>{m.visibility}</span>
                                        {!m.isEpic && (m.epicApplications?.[0]?.status) && (
                                            <span style={styles.metaBadge}>Epic: {m.epicApplications[0].status}</span>
                                        )}
                                        {typeof m.views === "number" && typeof m.uniques === "number" && (
                                            <span style={styles.metaBadge}>👁 {m.views} / {m.uniques}</span>
                                        )}
                                        {typeof m.cheerCount === "number" && (
                                            <span style={styles.metaBadge}>🎉 {m.cheerCount}</span>
                                        )}
                                        <span style={styles.metaBadge}>{m.theme}</span>
                                        <span style={styles.metaBadge}>
                                            {new Date(m.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div style={styles.rightActions}>
                                    <a href={`/c/${m.slug}/edit`} style={styles.actionLink}>Edit</a>
                                    <a href={`/api/moments/${m.slug}/analytics`} rel="nofollow" style={styles.actionLink}>Analytics</a>
                                    <a href={`/api/moments/${m.slug}/export`} rel="nofollow" style={styles.actionLink}>Export</a>

                                    {m.epicApplications?.[0]?.status === "PENDING" ? (
                                        <span style={styles.actionLink}>Epic: Pending</span>
                                    ) : (
                                        <form action={`/api/epic/apply`} method="post">
                                            <input type="hidden" name="slug" value={m.slug} />
                                            <input type="hidden" name="reason" value="Please consider this countdown for Epic." />
                                            <button style={styles.actionBtn} type="submit">Apply Epic</button>
                                        </form>
                                    )}

                                    <form action={`/api/moments/${m.slug}/delete`} method="post">
                                        <button style={styles.deleteBtn}>Delete</button>
                                    </form>
                                </div>
                            </li>
                        ))}
                        {otherGroup.length === 0 && (
                            <li style={styles.empty}>
                                <div style={{ textAlign: "center", color: "#B9C6DD" }}>
                                    No non-Epic items under current filter.
                                </div>
                            </li>
                        )}
                    </ul>
                </section>

                <section style={styles.listCard}>
                    <div style={styles.listTitle}>Following</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {following.map(f => {
                            const m = f.moment;
                            return (
                                <li key={f.id} className="row" style={styles.row}>
                                    <div style={styles.left}>
                                        <a href={`/c/${m.slug}`} style={styles.titleLink}>{m.title}</a>
                                        <div style={styles.meta}>
                                            <span style={styles.metaBadge}>/c/{m.slug}</span>
                                            <span style={styles.metaBadge}>{m.visibility}</span>

                                            {m.isEpic && (
                                                <span style={styles.epicBadge}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d="M12 3l2.5 5.2L20 9l-4 3.9.9 5.6L12 15.9 7.1 18.5 8 12.9 4 9l5.5-.8L12 3z" stroke="#FFD700" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    EPIC
                                                </span>
                                            )}

                                            {typeof m.views === "number" && typeof m.uniques === "number" && (
                                                <span style={styles.metaBadge}>👁 {m.views} / {m.uniques}</span>
                                            )}
                                            {typeof m.cheerCount === "number" && (
                                                <span style={styles.metaBadge}>🎉 {m.cheerCount}</span>
                                            )}
                                            <span style={styles.metaBadge}>
                                                {new Date(m.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={styles.rightActions}>
                                        <a href={`/c/${m.slug}`} style={styles.actionLink}>Open</a>
                                        <form action={`/api/moments/${m.slug}/follow`} method="post">
                                            <input type="hidden" name="op" value="unfollow" />
                                            <button style={styles.deleteBtn}>Unfollow</button>
                                        </form>
                                    </div>
                                </li>
                            );
                        })}
                        {following.length === 0 && (
                            <li style={styles.empty}>
                                <div style={{ textAlign: "center", color: "#B9C6DD" }}>
                                    You are not following any countdowns yet.
                                </div>
                            </li>
                        )}
                    </ul>
                </section>
            </div>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </main>
    );
}
