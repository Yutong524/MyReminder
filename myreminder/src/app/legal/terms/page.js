import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

function mdToHtml(md = "") {
    let t = md;
    t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    t = t.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    t = t.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    t = t.replace(/^# (.*)$/gm, "<h1>$1</h1>");
    t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*(.*?)\*/g, "<em>$1</em>");
    t = t.replace(/\n/g, "<br/>");
    return t;
}

export default async function TermsPage() {
    const file = path.join(process.cwd(), "public", "legal", "terms.md");
    let md = "# Terms of Use\n\nNo policy file found.";
    try {
        md = await fs.readFile(file, "utf8");
    } catch { }

    const html = mdToHtml(md);

    const styles = {
        page: { 
            maxWidth: 880, 
            margin: "40px auto", 
            padding: "0 16px", 
            color: "#EAF2FF" 
        },
        box: {
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(13,16,31,0.78), rgba(12,14,24,0.72))",
            padding: 24,
        },
        title: { marginTop: 0 },
        body: { color: "#C7D3E8", lineHeight: 1.6 },
    };

    return (
        <main style={styles.page}>
            <section style={styles.box}>
                <h1 style={styles.title}>Terms of Use</h1>
                <div style={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
            </section>
        </main>
    );
}
