import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const config = {
    api: {
        bodyParser: false
    }
};
export const runtime = "nodejs";

export async function POST(req) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers.get("stripe-signature");
    const raw = await req.text();

    let event;
    try {
        event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const s = event.data.object;
                const userId = s.metadata?.userId;
                const plan = s.metadata?.plan;
                if (!userId) break;

                const subId = s.subscription;
                let renew = null;
                if (subId) {
                    const sub = await stripe.subscriptions.retrieve(subId);
                    if (sub.current_period_end) renew = new Date(sub.current_period_end * 1000);
                }

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        stripeCustomerId: s.customer?.toString() || undefined,
                        stripeSubscriptionId: subId?.toString() || undefined,
                        plan: plan || "FREE",
                        planRenewsAt: renew
                    }
                });
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.created": {
                const sub = event.data.object;
                const customerId = sub.customer?.toString();
                if (!customerId) break;

                const user = await prisma.user.findFirst({
                    where: {
                        stripeCustomerId: customerId
                    }
                });
                if (!user) break;

                const renew = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
                const active = sub.status === "active" || sub.status === "trialing";
                let plan = user.plan;
                const priceId = sub.items?.data?.[0]?.price?.id || "";
                if (priceId === process.env.STRIPE_PRICE_MONTHLY) plan = "PRO_MONTHLY";
                if (priceId === process.env.STRIPE_PRICE_YEARLY) plan = "PRO_YEARLY";
                if (!active) plan = "FREE";

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripeSubscriptionId: sub.id,
                        plan,
                        planRenewsAt: renew
                    }
                });
                break;
            }
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                const customerId = sub.customer?.toString();
                if (!customerId) break;

                const user = await prisma.user.findFirst({
                    where: {
                        stripeCustomerId: customerId
                    }
                });
                if (!user) break;

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripeSubscriptionId: null,
                        plan: "FREE",
                        planRenewsAt: null
                    }
                });
                break;
            }
            default:
                break;
        }
    } catch (e) {
        return new Response(`Hook handler error: ${e.message}`, { status: 500 });
    }

    return new Response("ok", { status: 200 });
}
