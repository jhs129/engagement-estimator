import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: 'https://login.microsoftonline.com/common/v2.0',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
