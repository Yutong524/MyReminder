import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminEpicClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminEpicPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        redirect("/");
    }

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
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px, 40px 40px",
            maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)",
            pointerEvents: "none"
        },
        rays: {
            position: "absolute", inset: 0,
            background: "conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)",
            filter: "blur(40px)",
            pointerEvents: "none"
        },
        shell: {
            maxWidth: 1100,
            margin: "40px auto",
            padding: 16,
            position: "relative"
        },
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
        sub: {
            marginTop: 6,
            color: "#B9C6DD",
            fontSize: 14
        }
    };

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />
            <div style={styles.shell}>
                <section style={styles.card}>
                    <h1 style={styles.h1}>Epic Review</h1>
                    <p style={styles.sub}>Approve or reject submitted applications. Search & filter supported.</p>
                    <AdminEpicClient />
                </section>
            </div>
        </main>
    );
}
