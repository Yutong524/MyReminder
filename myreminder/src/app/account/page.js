import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountClient from "./client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect(`/api/auth/signin?callbackUrl=/account`);

    const email = session.user?.email || "";
    const twoFAEnabled = !!session.user?.twoFactorEnabled;

    const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, image: true }
    });

    const linked = await prisma.account.findMany({
        where: { userId: session.user.id },
        select: { id: true, provider: true, providerAccountId: true, type: true },
        orderBy: [{ provider: "asc" }, { providerAccountId: "asc" }]
    });
    const hasEmailLogin = !!email;

    const styles = {
        page: {
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)",
            color: "#EAF2FF",
            padding: 24
        },
        grid: {
            position: "absolute", inset: 0,
            backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px, 40px 40px",
            maskImage:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)",
            pointerEvents: "none"
        },
        rays: {
            position: "absolute", inset: 0,
            background:
                "conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)",
            filter: "blur(40px)",
            pointerEvents: "none"
        },
        shell: { maxWidth: 720, margin: "48px auto", padding: 16, position: "relative" },
        card: {
            borderRadius: 20,
            background: "linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
            padding: 22,
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
        sub: { marginTop: 6, marginBottom: 12, color: "#B9C6DD", fontSize: 14 }
    };

    return (
        <main style={styles.page}>
            <a href="/account/folders" className="navLink navGhost" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                borderRadius: 12,
                fontSize: 14,
                height: 38,
                padding: "0 12px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                color: "#C7D3E8"
            }}>
                Manage Folders
            </a>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />
            <div style={styles.shell}>
                <section style={styles.card}>
                    <h1 style={styles.h1}>Account</h1>
                    <p style={styles.sub}>
                        Manage profile, email, linked accounts, two-factor auth, sessions & security.
                    </p>
                    <AccountClient
                        initialEmail={email}
                        initialTwoFA={twoFAEnabled}
                        initialLinked={linked}
                        hasEmailLogin={hasEmailLogin}
                        initialProfile={{ name: me?.name || "", image: me?.image || "" }}
                    />
                </section>
            </div>
        </main>
    );
}
