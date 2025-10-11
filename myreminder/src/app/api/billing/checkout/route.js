import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
    );

    const { plan } = await req.json().catch(() => ({}));
    if (!["PRO_MONTHLY", "PRO_YEARLY"].includes(plan)) {
        return NextResponse.json(
            { error: "Invalid plan" },
            { status: 400 }
        );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const me = await prisma.user.findUnique({
        where: {
            id: session.user.id
        }
    });

    let customerId = me?.stripeCustomerId;
    if (!customerId) {
        const c = await stripe.customers.create({
            email: me?.email || undefined,
            metadata: {
                userId: session.user.id
            }
        });
        customerId = c.id;
        await prisma.user.update({
            where: {
                id: session.user.id
            },
            data: {
                stripeCustomerId: customerId
            }
        });
    }

    const priceId = plan === "PRO_MONTHLY" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{
            price: priceId,
            quantity: 1
        }],
        success_url: `${base}/account?billing=success`,
        cancel_url: `${base}/account?billing=cancel`,
        allow_promotion_codes: true,
        metadata: {
            userId: session.user.id,
            plan
        }
    });

    return NextResponse.json({ url: checkout.url });
}
