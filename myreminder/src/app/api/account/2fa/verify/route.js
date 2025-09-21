import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTotp, genBackupCodes } from '@/lib/totp';

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401 }
        );
    }

    const { token } = await req.json();

    if (!token) {
        return new Response(
            JSON.stringify({ error: 'Missing token' }),
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            twoFactorSecret: true,
            twoFactorEnabled: true
        }
    });

    if (!user?.twoFactorSecret) {
        return new Response(
            JSON.stringify({ error: 'No pending 2FA setup' }),
            { status: 400 }
        );
    }

    if (user.twoFactorEnabled) {
        return new Response(
            JSON.stringify({ error: '2FA already enabled' }),
            { status: 400 }
        );
    }

    const ok = verifyTotp(user.twoFactorSecret, token);

    if (!ok) {
        return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400 }
        );
    }

    const backupCodes = genBackupCodes(10);

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            twoFactorEnabled: true,
            twoFactorVerifiedAt: new Date(),
            twoFactorBackupCodes: backupCodes
        }
    });

    return new Response(
        JSON.stringify({ backupCodes }),
        { status: 200 }
    );
}
