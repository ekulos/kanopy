import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  // When deployed behind a proxy or using custom hostnames, enable trustHost
  trustHost: true,
  // Ensure a secret is provided (fall back to AUTH_SECRET if NEXTAUTH_SECRET isn't set)
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
