import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only allow @thinkhuge.net emails
      if (user.email && !user.email.endsWith("@thinkhuge.net")) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch user from database to get role and 2FA status
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, twoFactorEnabled: true },
        });

        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.twoFactorEnabled = dbUser.twoFactorEnabled;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Assign superadmin role to duff@thinkhuge.net
      if (user.email === "duff@thinkhuge.net") {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "superadmin" },
        });
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
  },
});

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      twoFactorEnabled?: boolean;
    };
  }
}
