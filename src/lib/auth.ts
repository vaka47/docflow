import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { demoUsers } from "@/lib/demo-users";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        demo: { label: "Demo", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const demoUser = demoUsers.find((user) => user.email === credentials.email);
        if (demoUser) {
          try {
            const password = await bcrypt.hash("demo", 10);
            await Promise.all(
              demoUsers.map((user) =>
                prisma.user.upsert({
                  where: { email: user.email },
                  update: {
                    name: user.name,
                    role: user.role,
                    team: user.team,
                    extraRoles: user.extraRoles ?? [],
                  },
                  create: {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    team: user.team,
                    extraRoles: user.extraRoles ?? [],
                    password,
                  },
                })
              )
            );
            const user = await prisma.user.findUnique({ where: { email: demoUser.email } });
            if (!user) return null;
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              extraRoles: user.extraRoles ?? [],
              team: user.team ?? "General",
            } as { id: string; name: string; email: string; role: UserRole; extraRoles: string[]; team: string };
          } catch {
            return {
              id: demoUser.email,
              name: demoUser.name,
              email: demoUser.email,
              role: demoUser.role as UserRole,
              extraRoles: demoUser.extraRoles ?? [],
              team: demoUser.team ?? "General",
            } as { id: string; name: string; email: string; role: UserRole; extraRoles: string[]; team: string };
          }
        }

        if (!credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          extraRoles: user.extraRoles ?? [],
          team: user.team ?? "General",
        } as { id: string; name: string; email: string; role: UserRole; extraRoles: string[]; team: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role;
        token.extraRoles = (user as { extraRoles?: string[] }).extraRoles ?? [];
        token.team = (user as { team?: string }).team ?? "General";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        (session.user as { extraRoles?: string[] }).extraRoles = (token as { extraRoles?: string[] }).extraRoles ?? [];
        (session.user as { team?: string }).team = (token as { team?: string }).team ?? "General";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
