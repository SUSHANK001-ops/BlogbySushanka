// =============================================================================
// NextAuth.js v5 configuration — Google + GitHub OAuth with JWT sessions
// =============================================================================

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * On sign-in, upsert user into our custom User table.
     */
    async signIn({ user, account }) {
      if (!account) return false;

      try {
        await prisma.user.upsert({
          where: { email: user.email ?? undefined },
          create: {
            name: user.name ?? "User",
            email: user.email,
            image: user.image,
            provider: account.provider,
          },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });
        return true;
      } catch (error) {
        console.error("Error upserting user:", error);
        return false;
      }
    },

    /**
     * Persist the database user ID in the JWT token.
     */
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.userId = dbUser.id;
        }
      }
      return token;
    },

    /**
     * Expose user ID from JWT to client-side session.
     */
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
});
