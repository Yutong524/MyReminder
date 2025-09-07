export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/x-m4a', 'audio/aac']);

export async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file' }, { status: 400 });
        }
        if (!ALLOWED.has(file.type)) {
            return NextResponse.json({ error: 'Unsupported audio type' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File too large' }, { status: 400 });
        }

        const buf = Buffer.from(await file.arrayBuffer());
        const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
        const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const pubDir = path.join(process.cwd(), 'public', 'u');
        
        await fs.mkdir(pubDir, { recursive: true });
        await fs.writeFile(path.join(pubDir, base), buf);
        const url = `/u/${base}`;

        return NextResponse.json({ ok: true, url });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
