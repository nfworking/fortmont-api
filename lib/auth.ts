import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function pickEntraValue(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeNullableString(value);

    if (typeof normalized === "string") {
      return normalized;
    }
  }

  return undefined;
}

async function syncEntraUser(profile: Record<string, unknown> | undefined) {
  const email = pickEntraValue(
    profile?.email,
    profile?.preferred_username,
    profile?.upn,
  )?.toLowerCase();

  const username = pickEntraValue(
    profile?.preferred_username,
    profile?.upn,
    profile?.email,
    profile?.name,
  )?.toLowerCase();

  const displayName = pickEntraValue(profile?.name, profile?.given_name, profile?.family_name);
  const avatarUrl = pickEntraValue(profile?.picture, profile?.avatarUrl, profile?.image);

  if (!email && !username) {
    return null;
  }

  const existingUser = await prisma.appUsers.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : []),
      ],
    },
  });

  if (existingUser) {
    return prisma.appUsers.update({
      where: { id: existingUser.id },
      data: {
        displayName: displayName ?? existingUser.displayName,
        email: email ?? existingUser.email,
        username: username ?? existingUser.username,
        avatarUrl: avatarUrl ?? existingUser.avatarUrl,
        isEntraUser: true,
        isActive: true,
      },
    });
  }

  return prisma.appUsers.create({
    data: {
      username: username ?? email?.split("@")[0] ?? "entra-user",
      displayName: displayName ?? null,
      email: email ?? null,
      avatarUrl: avatarUrl ?? null,
      passwordHash: "",
      isActive: true,
      isEntraUser: true,
    },
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const usernameValue = credentials?.username;
        const passwordValue = credentials?.password;

        const username =
          typeof usernameValue === "string"
            ? usernameValue.trim().toLowerCase()
            : "";
        const password = typeof passwordValue === "string" ? passwordValue : "";

        if (!username || !password) {
          return null;
        }

        const appUser = await prisma.appUsers.findUnique({
          where: { username },
        });

        if (!appUser || !appUser.isActive) {
          return null;
        }

        const passwordMatches = verifyPassword(password, appUser.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: appUser.id,
          name: appUser.displayName ?? appUser.username,
          email: appUser.email,
        };
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "microsoft-entra-id") {
        const syncedUser = await syncEntraUser(profile as Record<string, unknown> | undefined);

        if (syncedUser) {
          token.sub = syncedUser.id;
          token.name = syncedUser.displayName ?? syncedUser.username;
          token.email = syncedUser.email ?? token.email;
          token.username = syncedUser.username;
          token.role = syncedUser.role;
          token.phone = syncedUser.phone;
          token.avatarUrl = syncedUser.avatarUrl;
          token.isActive = syncedUser.isActive;
          token.isEntraUser = syncedUser.isEntraUser;
        }

        return token;
      }

      if (user?.id) {
        const appUser = await prisma.appUsers.findUnique({
          where: { id: user.id },
        });

        if (appUser) {
          token.sub = appUser.id;
          token.name = appUser.displayName ?? appUser.username;
          token.email = appUser.email ?? token.email;
          token.username = appUser.username;
          token.role = appUser.role;
          token.phone = appUser.phone;
          token.avatarUrl = appUser.avatarUrl;
          token.isActive = appUser.isActive;
          token.isEntraUser = appUser.isEntraUser;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.avatarUrl ?? session.user.image;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).id = token.sub;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).username = typeof token.username === "string" ? token.username : undefined;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).role = typeof token.role === "string" ? token.role : null;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).phone = typeof token.phone === "string" ? token.phone : null;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).avatarUrl = typeof token.avatarUrl === "string" ? token.avatarUrl : null;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).isActive = typeof token.isActive === "boolean" ? token.isActive : true;

        (session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
        }).isEntraUser = typeof token.isEntraUser === "boolean" ? token.isEntraUser : null;
      }

      return session;
    },
  },
});