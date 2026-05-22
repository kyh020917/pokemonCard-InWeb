import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { generateReferralCode } from "./utils/referral";

const isDev = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    // dev-only: test login without Kakao
    ...(isDev
      ? [
          CredentialsProvider({
            id: "dev-credentials",
            name: "개발용 테스트 로그인",
            credentials: { username: { label: "닉네임", type: "text" } },
            async authorize(credentials) {
              const username = (credentials?.username as string) || "dev_trainer";
              let user = await prisma.user.findFirst({ where: { username } });
              if (!user) {
                const referralCode = generateReferralCode();
                user = await prisma.user.create({
                  data: {
                    username,
                    referralCode,
                    coins: 5000,
                    name: username,
                    email: `${username}@dev.local`,
                  },
                });
              }
              return { id: user.id, name: user.username, email: user.email };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: isDev ? "jwt" : "database" },
  callbacks: {
    async session({ session, user, token }) {
      const userId = user?.id ?? (token?.sub as string | undefined);
      if (session.user && userId) {
        session.user.id = userId;
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { coins: true, username: true, referralCode: true },
        });
        if (dbUser) {
          session.user.coins = dbUser.coins;
          session.user.username = dbUser.username;
          session.user.referralCode = dbUser.referralCode;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const referralCode = generateReferralCode();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: user.name ?? `trainer_${user.id.slice(0, 6)}`,
          referralCode,
          coins: 1000,
        },
      });
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
