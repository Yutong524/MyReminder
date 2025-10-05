function base64urlFromBytes(bytes) {
    let b64;
    if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
        b64 = Buffer.from(bytes).toString('base64');
    } else {
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        b64 = btoa(bin);
    }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function randomToken(bytes = 24) {
    if (globalThis.crypto?.getRandomValues) {
        const arr = new Uint8Array(bytes);
        globalThis.crypto.getRandomValues(arr);
        return base64urlFromBytes(arr);
    } else {
        const { randomBytes } = await import('node:crypto');
        return base64urlFromBytes(randomBytes(bytes));
    }
}
