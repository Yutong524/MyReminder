import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admins";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Email({
            from: process.env.FROM_EMAIL,
            server: {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
                secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
            },
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    session: { strategy: "database" },
    pages: {
        signIn: "/signin",
        verifyRequest: "/verify-request",
        error: "/signin"
    },
    callbacks: {
        async session({ session, user }) {
            if (session?.user) {
                session.user.id = user.id;
                session.user.isAdmin = isAdminEmail(user.email);
                session.user.twoFactorEnabled = !!user.twoFactorEnabled;
            }
            return session;
        },
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
};

export const { auth: _auth } = NextAuth(authOptions);
