"use server";

export function readClientInfo(req) {
    const h = (req?.headers && typeof req.headers.get === "function")
        ? (k) => req.headers.get(k) || ""
        : () => "";

    const xff = h("x-forwarded-for") || h("x-real-ip") || "";
    const ip = (xff.split(",")[0] || "").trim() || h("cf-connecting-ip") || "";

    const city =
        h("x-vercel-ip-city") ||
        h("cf-ipcity") ||
        h("fly-client-city") ||
        "";

    const userAgent = h("user-agent") || "";
    return { ip, city, userAgent };
}
