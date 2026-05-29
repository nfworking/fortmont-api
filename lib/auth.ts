import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

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
});