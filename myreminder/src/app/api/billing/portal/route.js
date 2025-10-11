import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const me = await prisma.user.findUnique({
        where: {
            id: session.user.id
        }
    });
    if (!me?.stripeCustomerId) return NextResponse.json(
        { error: "No customer" },
        { status: 400 }
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const portal = await stripe.billingPortal.sessions.create({
        customer: me.stripeCustomerId,
        return_url: `${base}/account`
    });

    return NextResponse.json({ url: portal.url });
}
