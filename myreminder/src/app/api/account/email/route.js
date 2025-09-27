import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTOTP } from '@/lib/totp';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { email, totp, code, token, backupCode } = await req.json().catch(() => ({}));
    const clean = String(email || '').trim().toLowerCase();

    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            email: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            twoFactorBackupCodes: true,
        }
    });
    if (!me) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (me.email?.toLowerCase() === clean) {
        return NextResponse.json({ ok: true });
    }

    const exists = await prisma.user.findFirst({
        where: { email: clean, NOT: { id: session.user.id } },
        select: { id: true }
    });

    if (exists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';

    if (me.twoFactorEnabled) {
        const providedTotp = String(token || totp || code || '').trim();
        const providedBackup = String(backupCode || '').trim();

        if (!providedTotp && !providedBackup) {
            return NextResponse.json({ error: 'TOTP required', code: 'TOTP_REQUIRED' }, { status: 401 });
        }

        let verified = false;
        let usedBackupIndex = -1;

        if (providedTotp && me.totpSecret) {
            try {
                verified = verifyTOTP(me.totpSecret, providedTotp);
            } catch {
            }
        }

        if (!verified && providedBackup && Array.isArray(me.totpBackupCodes)) {
            for (let i = 0; i < me.totpBackupCodes.length; i) {
                const ok = await bcrypt.compare(providedBackup, me.totpBackupCodes[i]);
                if (ok) {
                    verified = true;
                    usedBackupIndex = i;
                    break;
                }
            }
        }

        if (!verified) {
            return NextResponse.json(
                { error: 'Invalid TOTP or backup code', code: 'TOTP_INVALID' },
                { status: 401 }
            );
        }

        if (usedBackupIndex >= 0) {
            const remaining = (me.totpBackupCodes || []).filter((_, idx) => idx !== usedBackupIndex);
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    email: clean,
                    totpBackupCodes: { set: remaining }
                }
            });
        } else {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { email: clean }
            });
        }
    } else {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { email: clean }
        });
    }

    return NextResponse.json({ ok: true });
}
