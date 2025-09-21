import { authenticator } from 'otplib';

authenticator.options = { step: 30, digits: 6, window: 1 };

export function makeTotpSecret(label, issuer = 'MyReminder') {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(label, issuer, secret);
    
    return { secret, otpauth };
}

export function verifyTotp(secret, token) {
    if (!secret || !token) return false;
    return authenticator.verify({ secret, token: String(token).replace(/\s/g, '') });
}

export function genBackupCodes(n = 10) {
    return Array.from({ length: n }, () =>
        crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
    );
}
