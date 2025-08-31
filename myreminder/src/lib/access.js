import crypto from 'crypto';

const SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-insecure-secret-change-me';

function b64url(buf) {
    return Buffer.from(buf).toString('base64url');
}
function sign(data) {
    return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function issueAccessToken(slug, ttlSeconds = 60 * 60 * 24 * 7) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = JSON.stringify({ s: slug, e: exp });
    const p = b64url(payload);
    const sig = sign(p);
    return `${p}.${sig}`;
}

export function verifyAccessToken(token, slug) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return false;
    const [p, sig] = token.split('.');
    if (sign(p) !== sig) return false;
    try {
        const { s, e } = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
        if (s !== slug) return false;
        if (typeof e !== 'number' || e < Math.floor(Date.now() / 1000)) return false;
        return true;
    } catch {
        return false;
    }
}

export function cookieNameFor(slug) {
    return `mr_access_${slug}`;
}
