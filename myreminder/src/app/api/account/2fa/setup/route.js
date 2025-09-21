import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { makeTotpSecret } from '@/lib/totp';
import QRCode from 'qrcode';

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401 }
        );
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            twoFactorEnabled: true
        }
    });

    if (!user) {
        return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404 }
        );
    }

    if (user.twoFactorEnabled) {
        return new Response(
            JSON.stringify({ error: '2FA already enabled' }),
            { status: 400 }
        );
    }

    const { secret, otpauth } = makeTotpSecret(
        user.email || `user-${userId}`
    );

    const qrDataUrl = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret }
    });

    return new Response(
        JSON.stringify({ qrDataUrl }),
        { status: 200 }
    );
}
