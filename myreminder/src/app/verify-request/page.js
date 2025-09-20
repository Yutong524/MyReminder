import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VerifyRequestPage() {
    const h = headers();
    const host =
        h.get("x-forwarded-host") ||
        h.get("host") ||
        process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "") ||
        "";

    const styles = {
        page: {
            minHeight: "100vh",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(180deg, #0A0F1F 0%, #0A0B12 100%)",
            color: "#EAF2FF",
            padding: 24,
            display: "grid",
            placeItems: "center",
        },
        grid: {
            position: "absolute",
            inset: 0,
            backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px, 40px 40px",
            maskImage:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 75%)",
            pointerEvents: "none",
        },
        rays: {
            position: "absolute",
            inset: 0,
            background:
                "conic-gradient(from 220deg at 110% 10%, rgba(255, 193, 7, 0.22), transparent 30%), conic-gradient(from 140deg at -10% 0%, rgba(13, 99, 229, 0.25), transparent 35%)",
            filter: "blur(40px)",
            pointerEvents: "none",
        },
        card: {
            width: "100%",
            maxWidth: 520,
            borderRadius: 20,
            padding: 24,
            background: "linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
                "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
            position: "relative",
            zIndex: 1,
            textAlign: "center",
        },
        h1: {
            margin: 0,
            fontSize: "clamp(26px, 4vw, 36px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            backgroundImage:
                "linear-gradient(90deg, #DCEAFF 0%, #7FB3FF 45%, #FFC107 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
        },
        p: { marginTop: 12, color: "#B9C6DD", fontSize: 15 },
        host: {
            marginTop: 8,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            color: "#C7D3E8",
            opacity: 0.9,
        },
        btnRow: { display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" },
        btnPrimary: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 12,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, #0D63E5 0%, #0A4BBB 100%)",
            color: "#FFFFFF",
            fontWeight: 600,
            boxShadow:
                "0 12px 24px rgba(13,99,229,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
        },
        btnGhost: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 12,
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            color: "#C7D3E8",
            fontWeight: 500,
        },
        hr: {
            marginTop: 16,
            border: "none",
            borderTop: "1px solid rgba(255,255,255,0.08)",
        },
        hint: { marginTop: 10, color: "#8FA5C6", fontSize: 13 },
    };

    const css = [
        ".btn{transition:transform .16s ease, box-shadow .16s ease}",
        ".btn:hover{transform:translateY(-1px); box-shadow:0 16px 30px rgba(13,99,229,.38)}",
    ].join("\n");

    return (
        <main style={styles.page}>
            <div style={styles.grid} aria-hidden />
            <div style={styles.rays} aria-hidden />
            <section style={styles.card}>
                <h1 style={styles.h1}>Check your email</h1>
                <p style={styles.p}>
                    We just sent you a secure sign-in link. Open your inbox and click the button in that email to continue.
                </p>
                <div style={styles.host}>{host}</div>

                <div style={styles.btnRow}>
                    <Link href="/signin" className="btn" style={styles.btnGhost}>
                        ← Back to sign in
                    </Link>
                    <Link href="/" className="btn" style={styles.btnPrimary}>
                        Go to homepage
                    </Link>
                </div>

                <hr style={styles.hr} />
                <p style={styles.hint}>
                    Tip: If you don't see it, check your spam folder or wait a minute and try again.
                </p>
            </section>

            <style dangerouslySetInnerHTML={{ __html: css }} />
        </main>
    );
}
