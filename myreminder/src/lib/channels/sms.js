function basicAuth() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('Missing Twilio credentials');
    return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
}

export async function sendSMS({ to, body }) {
    const from = process.env.TWILIO_FROM;
    const sid = process.env.TWILIO_ACCOUNT_SID;
    if (!from) throw new Error('Missing TWILIO_FROM');
    if (!sid) throw new Error('Missing TWILIO_ACCOUNT_SID');

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const form = new URLSearchParams();
    form.set('From', from);
    form.set('To', to);
    form.set('Body', body);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: basicAuth(),
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: form.toString(),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.sid) {
        throw new Error(`Twilio error: ${json?.message || res.status}`);
    }
    return { id: json.sid };
}
