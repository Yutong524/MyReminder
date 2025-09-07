export async function sendDiscord({ webhook, content }) {
    if (!webhook) throw new Error('No Discord webhook');
    const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Discord ${res.status}: ${t}`);
    }
    
    return { id: null };
}
