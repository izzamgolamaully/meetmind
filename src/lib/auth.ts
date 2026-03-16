// src/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      // Fetch latest user data including plan
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, plan: true, stripeCustomerId: true },
        })
        if (dbUser) {
          token.plan = dbUser.plan
          token.stripeCustomerId = dbUser.stripeCustomerId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Create Stripe customer on signup
      if (user.email) {
        const stripe = (await import("./stripe")).stripe
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name ?? undefined,
          metadata: { userId: user.id },
        })
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customer.id },
        })
      }
    },
  },
}

// Extend session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan?: string
    }
  }
}
