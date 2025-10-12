import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
    const now = new Date();

    const jobs = await prisma.reminderJob.findMany({
        where: {
            status: {
                in: ["PENDING", "QUEUED"]
            },
            scheduledAt: { lte: now }
        },
        orderBy: [{ scheduledAt: "asc" }],
        take: 50
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const job of jobs) {
        try {
            if (job.idempotencyKey) {
                const dup = await prisma.reminderJob.findFirst({
                    where: {
                        idempotencyKey: job.idempotencyKey,
                        status: { in: ["SENT", "DELIVERED"] }
                    },
                    select: { id: true }
                });
                if (dup) {
                    await prisma.reminderJob.update({
                        where: { id: job.id },
                        data: {
                            status: "SKIPPED",
                            lastError: "DEDUPE_SKIPPED",
                            updatedAt: new Date()
                        }
                    });
                    await prisma.deliveryLog.create({
                        data: {
                            momentId: job.momentId,
                            jobId: job.id,
                            status: "SKIPPED",
                            message: "DEDUPE_SKIPPED"
                        }
                    });
                    skipped++;
                    continue;
                }
            }

            await prisma.reminderJob.update({
                where: { id: job.id },
                data: {
                    status: "QUEUED",
                    updatedAt: new Date()
                }
            });

            await new Promise((r) => setTimeout(r, 50));

            await prisma.reminderJob.update({
                where: { id: job.id },
                data: {
                    status: "SENT",
                    sentAt: new Date(),
                    updatedAt: new Date()
                }
            });
            await prisma.deliveryLog.create({
                data: {
                    momentId: job.momentId,
                    jobId: job.id,
                    status: "SENT",
                    message: "OK"
                }
            });
            sent++;
        } catch (e) {
            failed++;
            await prisma.reminderJob.update({
                where: { id: job.id },
                data: {
                    status: "FAILED",
                    attempts: job.attempts + 1,
                    lastError: e?.message?.slice(0, 500) || "SEND_ERROR",
                    updatedAt: new Date()
                }
            });
            await prisma.deliveryLog.create({
                data: {
                    momentId: job.momentId,
                    jobId: job.id,
                    status: "FAILED",
                    message: e?.message?.slice(0, 500) || "SEND_ERROR"
                }
            });
        }
    }

    return NextResponse.json({
        ok: true,
        sent,
        skipped,
        failed,
        scanned:
            jobs.length
    });
}
