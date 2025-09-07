export async function sendSlack({ webhook, text }) {
    if (!webhook) throw new Error('No Slack webhook');
    const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Slack ${res.status}: ${t}`);
    }

    return { id: null };
}
