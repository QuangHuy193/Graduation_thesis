// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions, User as NextAuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/auth"; // implement của bạn

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or phone", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) return null;
                const user = await verifyCredentials(
                    credentials.identifier,
                    credentials.password
                );
                if (!user) throw new Error("Sai tài khoản hoặc mật khẩu");
                if (user.status === 2) {
                    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ CSKH để biết thêm chi tiết.");
                }
                // NextAuth expects a User-like object
                return {
                    id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    vip: user.vip,
                    status: user.status
                } as unknown as NextAuthUser;
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 1 ngày; thay đổi nếu cần
    },

    callbacks: {
        // jwt callback: thêm claim vào token
        async jwt({
            token,
            user,
        }: {
            token: JWT;
            user?: Partial<NextAuthUser> | undefined;
        }): Promise<JWT> {
            if (user) {
                token.role = (user as any).role;
                token.name = (user as any).name;
                token.user_id = (user as any).id ?? (user as any).user_id;
                token.vip = (user as any).vip;
                token.status = (user as any).status;
            }
            return token;
        },

        // session callback: expose token -> session.client
        async session({
            session,
            token,
        }: {
            session: Session;
            token: JWT;
        }): Promise<Session> {
            session.user = session.user || ({} as any);
            (session.user as any).role = token.role;
            (session.user as any).vip = token.vip;
            (session.user as any).user_id = token.user_id;
            (session.user as any).name = token.name ?? session.user.name;
            (session.user as any).status = token.status;
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
