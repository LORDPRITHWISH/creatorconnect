import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { JWT } from "@auth/core/jwt";
import { prisma } from "./lib/prisma";
import axios from "axios";


export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email as string },
      });

      const expiresInTimestamp =
        Date.now() + (account?.expires_in! * 1000 || 0);

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email as string,
            name: user.name as string,
            image: user.image as string,
            access_token: account?.access_token as string,
            expires_in: Math.floor(Date.now() / 1000) + account?.expires_in!,
            refresh_token: account?.refresh_token as string,
          },
        });
      } else {
        await prisma.user.update({
          where: { email: user.email as string },
          data: {
            access_token: account?.access_token as string,
            expires_in: Math.floor(Date.now() / 1000) + account?.expires_in!,
            refresh_token: account?.refresh_token as string,
          },
        });
      }
      return true;
    },
    async jwt({
      token,
      account,
      user,
    }: {
      user: any;
      token: JWT & { expires_in?: number };
      account?: any;
    }) {
      if (user) {
        const userData = await prisma.user.findUnique({
          where: { email: user.email as string },
        });
        token.role = userData?.role;
        token.id = userData?.id;
        token.email = userData?.email;
        token.name = userData?.name.toLowerCase();
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresIn = Math.floor(Date.now() / 1000) + account?.expires_in!;
      }

      if (Math.floor(Date.now() / 1000) > token.expires_in!) {
        return await refreshAccessToken(token);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.name = token.name;
      session.user.role = token.role as string | undefined;
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.accessToken = token.accessToken as string;
      session.user.refreshToken = token.refreshToken as string;
      return session;
    },
  },
});

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: process.env.AUTH_GOOGLE_ID as string,
          client_secret: process.env.AUTH_GOOGLE_SECRET as string,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        },
      }
    );
    const refreshedToken = response.data;

    return {
      ...token,
      accessToken: refreshedToken.access_token,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
      expiresIn: Date.now() + refreshedToken.expires_in * 1000,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
