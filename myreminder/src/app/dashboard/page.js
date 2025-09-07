import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect(`/api/auth/signin?callbackUrl=/dashboard`);
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
        },
    });

    return (
        <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
            <h1>My Countdowns</h1>
            <p style={{ opacity: .8 }}>Only countdowns you created while signed in will appear here.</p>
            <div style={{ margin: "8px 0 16px", display: "flex", gap: 12 }}>
                <a href="/api/export" rel="nofollow">Download my data (JSON)</a>
                <a href="/api/export?format=csv" rel="nofollow">Download moments (CSV)</a>
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
                {moments.map(m => (
                    <li key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <a href={`/c/${m.slug}`}>{m.title}</a>
                                <div style={{ fontSize: 12, opacity: .7 }}>
                                    /c/{m.slug} · {m.visibility}
                                    {typeof m.views === 'number' && typeof m.uniques === 'number' && (
                                        <> · 👁 {m.views} views / {m.uniques} uniques</>
                                    )}
                                    {typeof m.cheerCount === 'number' && <> · {m.cheerCount}</>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <a href={`/c/${m.slug}/edit`}>Edit</a>
                                <a href={`/api/moments/${m.slug}/analytics`} rel="nofollow">Analytics</a>
                                <a href={`/api/moments/${m.slug}/export`} rel="nofollow">Export</a>
                                <form action={`/api/moments/${m.slug}/delete`} method="post">
                                    <button>Delete</button>
                                </form>
                            </div>
                        </div>
                    </li>
                ))}
                {moments.length === 0 && <li>No items yet.</li>}
            </ul>
        </main>
    );
}
