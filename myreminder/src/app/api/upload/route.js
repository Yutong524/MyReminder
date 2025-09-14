export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

async function ensureDir(dir) {
    try { await fs.mkdir(dir, { recursive: true }); } catch { }
}

export async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get('file');
        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file' }, { status: 400 });
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
        const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
        const dir = path.join(process.cwd(), 'public', 'u');

        await ensureDir(dir);
        await fs.writeFile(path.join(dir, name), buf);

        const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '') || '';
        const url = `${base}/u/${name}` || `/u/${name}`;

        return NextResponse.json({ ok: true, url });
    } catch (e) {
        console.error(e);
        
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
