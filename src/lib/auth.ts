import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Auto-create/update profile on first login
      if (account?.provider === 'google' && user.id) {
        try {
          // Dynamic import to avoid bundling pg in edge runtime
          const pool = (await import('@/lib/db')).default;
          await pool.query(
            `INSERT INTO public.profiles (id, display_name, avatar_url)
             VALUES ($1, $2, $3)
             ON CONFLICT (id) DO UPDATE
             SET display_name = COALESCE($2, profiles.display_name),
                 avatar_url = COALESCE($3, profiles.avatar_url),
                 updated_at = NOW()`,
            [user.id, user.name, user.image]
          );
        } catch (err) {
          console.error('Error upserting profile:', err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
