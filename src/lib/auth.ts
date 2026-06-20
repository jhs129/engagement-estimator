import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, profile }) {
      const preferredEmail = (profile?.preferred_username as string | undefined) ?? user.email;
      if (!preferredEmail) return false;

      const email = preferredEmail.toLowerCase();

      const adminEmail = process.env.ADMIN_EMAIL;
      const isEnvAdmin = adminEmail && email === adminEmail.toLowerCase();

      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { firstName: true, image: true, email: true },
      });

      if (!dbUser && !isEnvAdmin) {
        return '/login?error=AccessDenied';
      }

      if (!dbUser && isEnvAdmin) {
        await prisma.user.create({
          data: { email, role: 'ADMIN' },
        });
      }

      const dbEmail = dbUser?.email ?? email;

      const profileName = profile?.name as string | undefined;
      const givenName = (profile?.given_name as string | undefined) ?? null;
      const familyName = (profile?.family_name as string | undefined) ?? null;

      if (dbUser) {
        const updates: Record<string, string | null> = {};

        const profileImage = (profile?.picture as string | undefined) ?? user.image ?? null;
        if (!dbUser.image && profileImage) {
          updates.image = profileImage;
        }

        if (!dbUser.firstName && (givenName || familyName || profileName)) {
          updates.firstName = givenName ?? profileName?.split(' ')[0] ?? null;
          updates.lastName = familyName ?? (profileName?.split(' ').slice(1).join(' ') || null);
        }

        if (Object.keys(updates).length > 0) {
          await prisma.user.updateMany({
            where: { email: dbEmail },
            data: updates,
          });
        }
      }

      if (isEnvAdmin) {
        await prisma.user.updateMany({
          where: { email: dbEmail },
          data: { role: 'ADMIN' },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.email || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email ?? '' },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }
      if (session.user && token.role) {
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
});
