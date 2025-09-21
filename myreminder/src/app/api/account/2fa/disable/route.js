import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }),
            { status: 401 }
        );
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: [],
            twoFactorVerifiedAt: null
        }
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
