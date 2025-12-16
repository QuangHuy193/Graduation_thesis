// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    user_id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    vip?: string;
  }

  interface Session {
    user: {
      user_id?: number | string;
      name?: string;
      email?: string;
      role?: string;
      vip?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user_id?: number | string;
    name?: string;
    email?: string;
    role?: string;
  }
}
